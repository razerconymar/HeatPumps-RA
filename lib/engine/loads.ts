// Step 3 - Heating and cooling need per temperature range (workbook sheet: Loads). Port of hp_engine/loads.py.
import type { Assumptions } from "./assumptions.ts";
import type { HouseResult } from "./house.ts";
import type { HouseInputs } from "./types.ts";
import { binIndex, type WeatherResult } from "./weather.ts";

export interface LoadBin {
  t: number;
  hours: number;
  heatNeed: number;      // Btu/h at the rooms, day/night blended (col. K)
  coolSensible: number;  // col. R
  coolLatent: number;    // col. S
  coolNeed: number;      // col. T
}

export interface LoadsResult {
  sunHeatBtuh: number;       // B34
  sunCoolBtuh: number;       // B35
  indoorHumidity: number;    // B36
  ventilationCfm: number;    // B37
  designHeatF: number;       // B12
  designHeatBtuh: number;    // B14
  designCoolF: number;       // B15
  designCoolBtuh: number;    // B17
  heatAnnualMmbtu: number;   // B6
  coolAnnualMmbtu: number;   // B7
  latentAnnualMmbtu: number; // B8
  heatingHours: number;      // B9
  coolingHours: number;      // B10
  bins: LoadBin[];
}

export function humidityRatio(tF: number, rh: number, pKpa: number): number {
  const tc = ((tF - 32) * 5) / 9;
  const pws = 0.61094 * Math.exp((17.625 * tc) / (tc + 243.04));
  return (0.621945 * rh * pws) / (pKpa - rh * pws);
}

export function computeLoads(inp: HouseInputs, house: HouseResult, wx: WeatherResult, a: Assumptions): LoadsResult {
  const s = a.sun, g = a.geometry;
  const { ua, elaIn2: ela, stackCoeff: cs, windCoeff: cw, internalGainBtuh: gint, latentGainBtuh: glat } = house;
  const tIn = inp.t_heat_f, tCool = inp.t_cool_f;

  const perWall = (house.windowArea / 4) * house.windowShgc * s.exteriorShading * s.kwhM2ToBtuFt2;
  const sunHeatDay = perWall * s.blindsWinter * wx.sunHeatingSum;
  const sunCoolDay = perWall * s.blindsSummer * wx.sunCoolingSum;
  const sunH = sunHeatDay / (24 * wx.daylightHeatingSeason);
  const sunC = sunCoolDay / (24 * wx.daylightCoolingSeason);
  const wIn = humidityRatio(tCool, s.indoorRh, s.pressureKpa);
  const vent = s.ventilationLevels.includes(house.level) ? 0.03 * house.floorArea + 7.5 * (house.bedrooms + 1) : 0;
  const leak = (dt: number, wind: number) => Math.max(vent, ela * Math.sqrt(cs * Math.abs(dt) + cw * wind ** 2));

  const bins: LoadBin[] = wx.bins.map((b) => {
    const dtH = tIn - b.t;
    const cfmH = leak(dtH, b.windMph);
    const surfH = ua * dtH;
    const leakH = g.airHeat * cfmH * dtH;
    const heatNeed = b.daylight * Math.max(0, surfH + leakH - gint - sunH) + (1 - b.daylight) * Math.max(0, surfH + leakH - gint);

    const dtC = b.t - tCool;
    const cfmC = leak(dtC, b.windMph);
    const surfC = ua * dtC;
    const leakC = g.airHeat * cfmC * dtC;
    const coolSensible = b.t < s.windowsOpenF
      ? 0
      : b.daylight * Math.max(0, surfC + leakC + gint + sunC) + (1 - b.daylight) * Math.max(0, surfC + leakC + gint);
    const coolLatent = coolSensible > 0 ? glat + s.airLatent * cfmC * Math.max(0, b.humidity - wIn) : 0;
    return { t: b.t, hours: b.hours, heatNeed, coolSensible, coolLatent, coolNeed: coolSensible + coolLatent };
  });

  const tCold = wx.heatingDesignF;
  const windCold = wx.bins[binIndex(tCold)].windMph;
  const dth = tIn - tCold;
  const designHeat = ua * dth + g.airHeat * ela * Math.sqrt(cs * dth + cw * windCold ** 2) * dth;

  const tHot = wx.coolingDesignF;
  const hot = wx.bins[binIndex(tHot)];
  const cfmHot = ela * Math.sqrt(cs * Math.abs(tHot - tCool) + cw * hot.windMph ** 2);
  const designCool = ua * (tHot - tCool) + g.airHeat * cfmHot * (tHot - tCool) + gint + sunC + glat
    + s.airLatent * cfmHot * Math.max(0, hot.humidity - wIn);

  const sum = (f: (b: LoadBin) => number) => bins.reduce((acc, b) => acc + f(b), 0);
  return {
    sunHeatBtuh: sunH, sunCoolBtuh: sunC, indoorHumidity: wIn, ventilationCfm: vent,
    designHeatF: tCold, designHeatBtuh: designHeat, designCoolF: tHot, designCoolBtuh: designCool,
    heatAnnualMmbtu: sum((b) => (b.heatNeed * b.hours) / 1e6),
    coolAnnualMmbtu: sum((b) => (b.coolNeed * b.hours) / 1e6),
    latentAnnualMmbtu: sum((b) => b.coolLatent * b.hours) / 1e6,
    heatingHours: sum((b) => (b.heatNeed > 0 ? b.hours : 0)),
    coolingHours: sum((b) => (b.coolNeed > 0 ? b.hours : 0)),
    bins,
  };
}
