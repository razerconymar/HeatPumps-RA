// HP Rating + Step 4 - Equipment (workbook sheets: HP Rating, Equipment). Port of hp_rating.py and equipment.py.
import type { Assumptions } from "./assumptions.ts";
import type { LoadsResult } from "./loads.ts";
import type { HeatPumpRating, HouseInputs } from "./types.ts";

/** Straight lines through the 47/17/5°F rated points; zero floor below 5°F. */
export function capacityAt(t: number, c47: number, c17: number, c5: number): number {
  if (t >= 17) return c17 + ((c47 - c17) * (t - 17)) / 30;
  return Math.max(0, c5 + ((c17 - c5) * (t - 5)) / 12);
}

export interface HPRatingResult {
  resistanceShare: number;       // D35
  compressorBtuPerWh: number;    // D37
  hspf2: number;
}

/** Remove the backup heat already counted inside HSPF2, using DOE Region IV (10 CFR 430 App. M1). */
export function computeHpRating(hp: HeatPumpRating, a: Assumptions): HPRatingResult {
  const r = a.rating;
  const c47 = hp.cap47OverCooling, c17 = c47 * hp.cap17OverCap47, c5 = c47 * hp.cap5OverCap47;
  let backup = 0, load = 0;
  for (const [t, w] of r.bins) {
    const bl = ((r.zeroLoadF - t) / (r.zeroLoadF - r.outdoorDesignF)) * r.slopeFactor;
    backup += Math.max(0, bl - capacityAt(t, c47, c17, c5)) * w;
    load += bl * w;
  }
  const share = backup / load;
  const comp = (1 - share) / (1 / hp.hspf2 - share / (a.equipment.btuPerKwh / 1000));
  return { resistanceShare: share, compressorBtuPerWh: comp, hspf2: hp.hspf2 };
}

export interface EquipmentBin {
  t: number; hours: number; heatNeed: number; coolNeed: number; hpCapacity: number; hpDelivered: number; backup: number;
  gasTherms: number; propaneGal: number; elecFurnaceKwh: number; hpHeatKwh: number; backupKwh: number;
  acKwh: number; hpCoolKwh: number;
}

export interface EquipmentResult {
  afueGas: number; afuePropane: number; effElectric: number; seer2Ac: number; seer2Hp: number;
  compressorBtuPerWh: number;
  designCoolEquipBtuh: number;   // D32
  hpSizeBtuh: number;            // D33
  hpTons: number;
  designHeatEquipBtuh: number;   // D38
  hpCapAtDesign: number;         // D39
  designCoverage: number;        // D40
  fanKwh: number;                // D42
  totals: { gasTherms: number; propaneGal: number; elecFurnaceKwh: number; hpHeatKwh: number; backupKwh: number;
    acKwh: number; hpCoolKwh: number };
  gasFurnace: { therms: number; kwh: number };      // B46 / C46
  propaneFurnace: { gallons: number; kwh: number }; // B47 / C47
  electricFurnaceKwh: number;                       // C48
  heatPumpKwh: number;                              // C49
  backupKwh: number;                                // C50
  backupHeatShare: number;                          // C51
  bins: EquipmentBin[];
}

export function computeEquipment(inp: HouseInputs, loads: LoadsResult, hp: HeatPumpRating, rating: HPRatingResult,
  a: Assumptions): EquipmentResult {
  const e = a.equipment, z = a.sizing;
  const pick = (r: { existing: number; new: number }) => (inp.baseline === "New replacement" ? r.new : r.existing);
  const afueG = pick(e.afueGas), afueP = pick(e.afuePropane), effE = pick(e.effElectric), seerAc = pick(e.seer2Ac);

  const dCool = loads.designCoolBtuh / z.dse;
  const size = Math.max(z.sizeMinBtuh, Math.floor((z.sizeFactor * dCool) / z.sizeStepBtuh) * z.sizeStepBtuh);
  const c47 = size * hp.cap47OverCooling, c17 = c47 * hp.cap17OverCap47, c5 = c47 * hp.cap5OverCap47;
  const dHeat = loads.designHeatBtuh / z.dse;
  const capDesign = capacityAt(loads.designHeatF, c47, c17, c5);
  const fan = ((z.fanKwhFixed + z.fanKwhPerKbtuh * (dHeat / 1000)) * ((loads.heatAnnualMmbtu * 1e6) / z.dse / dHeat))
    / z.fanReferenceHours;
  const comp = rating.compressorBtuPerWh;

  const bins: EquipmentBin[] = loads.bins.map((b) => {
    const h = b.hours;
    const heatNeed = b.heatNeed / z.dse, coolNeed = b.coolNeed / z.dse;
    const cap = capacityAt(b.t, c47, c17, c5);
    const deliv = Math.min(heatNeed, cap), back = heatNeed - deliv;
    return {
      t: b.t, hours: h, heatNeed, coolNeed, hpCapacity: cap, hpDelivered: deliv, backup: back,
      gasTherms: (heatNeed * h) / afueG / e.btuPerTherm,
      propaneGal: (heatNeed * h) / afueP / e.btuPerGallonPropane,
      elecFurnaceKwh: (heatNeed * h) / effE / e.btuPerKwh,
      hpHeatKwh: (deliv * h) / (comp * 1000),
      backupKwh: (back * h) / e.btuPerKwh,
      acKwh: (coolNeed * h) / (seerAc * 1000),
      hpCoolKwh: (coolNeed * h) / (hp.seer2 * 1000),
    };
  });
  const tot = (k: keyof EquipmentBin) => bins.reduce((s, b) => s + (b[k] as number), 0);
  const totals = {
    gasTherms: tot("gasTherms"), propaneGal: tot("propaneGal"), elecFurnaceKwh: tot("elecFurnaceKwh"),
    hpHeatKwh: tot("hpHeatKwh"), backupKwh: tot("backupKwh"), acKwh: tot("acKwh"), hpCoolKwh: tot("hpCoolKwh"),
  };
  const need = bins.reduce((s, b) => s + b.heatNeed * b.hours, 0);
  return {
    afueGas: afueG, afuePropane: afueP, effElectric: effE, seer2Ac: seerAc, seer2Hp: hp.seer2,
    compressorBtuPerWh: comp, designCoolEquipBtuh: dCool, hpSizeBtuh: size, hpTons: size / 12000,
    designHeatEquipBtuh: dHeat, hpCapAtDesign: capDesign, designCoverage: capDesign / dHeat, fanKwh: fan, totals,
    gasFurnace: { therms: totals.gasTherms, kwh: totals.acKwh + fan },
    propaneFurnace: { gallons: totals.propaneGal, kwh: totals.acKwh + fan },
    electricFurnaceKwh: totals.elecFurnaceKwh + totals.acKwh + fan,
    heatPumpKwh: totals.hpHeatKwh + totals.backupKwh + totals.hpCoolKwh,
    backupKwh: totals.backupKwh,
    backupHeatShare: need ? bins.reduce((s, b) => s + b.backup * b.hours, 0) / need : 0,
    bins,
  };
}
