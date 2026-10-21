// Step 2 - County weather (workbook sheet: Weather). Port of hp_engine/weather.py.
import type { EngineData, HouseInputs } from "./types.ts";

export interface Bin {
  t: number; hours: number; windMph: number; humidity: number; daylight: number;
}

export interface WeatherResult {
  county: string;
  stationId: string;
  station: string;
  distanceMi: number;
  farMatch: boolean;
  weatherYear: string;
  whichYear: string;
  hdd65: number;               // B11
  hdd65Rebuilt: number;        // B12
  cdd65Rebuilt: number;        // B13
  totalHours: number;          // B15
  heatingDesignF: number;      // coldest 1% of hours
  coolingDesignF: number;      // hottest 1% of hours
  daylightHeatingSeason: number;
  daylightCoolingSeason: number;
  sunHeatingSum: number;       // N+E+S+W wall sun, Oct-Apr, statewide, kWh/m² per day
  sunCoolingSum: number;
  bins: Bin[];
}

/** 0-based index of the 5°F range containing t: Excel MIN(29,MAX(1,INT((t+32.5)/5)+1)) - 1. */
export function binIndex(t: number, nBins = 29): number {
  return Math.min(nBins, Math.max(1, Math.floor((t + 32.5) / 5) + 1)) - 1;
}

function statewideSun(data: EngineData, field: "heatingSeason" | "coolingSeason"): number {
  let total = 0;
  for (const wall of ["North", "East", "South", "West"]) {
    const vals = data.solar.filter((r) => r.wall === wall).map((r) => r[field]);
    total += vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  return total;
}

export function computeWeather(inp: HouseInputs, data: EngineData): WeatherResult {
  const county = data.counties[inp.county];
  if (!county) throw new Error(`Unknown county "${inp.county}"`);
  const sid = county.stationId;
  const st = data.stations[sid];
  const hours = data.hours[`${sid}|${inp.weather_year}`];
  const bins: Bin[] = data.binTemps.map((t, i) => ({
    t, hours: hours[i], windMph: data.windStatewide[i], humidity: data.humidity[sid][i], daylight: data.daylight[sid][i],
  }));
  const whichYear = inp.weather_year === "Average"
    ? `Average of ${st.usableYears} years, 2010-2024`
    : inp.weather_year === "Mild" ? st.mildYear : st.extremeYear;
  const [dh, dc] = data.daylightSeason[sid];
  return {
    county: inp.county, stationId: sid, station: county.station, distanceMi: county.distanceMi,
    farMatch: county.farMatch, weatherYear: inp.weather_year, whichYear,
    hdd65: st.hdd65[inp.weather_year] as number,
    hdd65Rebuilt: bins.reduce((s, b) => s + (b.hours * Math.max(0, 65 - b.t)) / 24, 0),
    cdd65Rebuilt: bins.reduce((s, b) => s + (b.hours * Math.max(0, b.t - 65)) / 24, 0),
    totalHours: bins.reduce((s, b) => s + b.hours, 0),
    heatingDesignF: st.heatingDesignF, coolingDesignF: st.coolingDesignF,
    daylightHeatingSeason: dh, daylightCoolingSeason: dc,
    sunHeatingSum: statewideSun(data, "heatingSeason"), sunCoolingSum: statewideSun(data, "coolingSeason"),
    bins,
  };
}
