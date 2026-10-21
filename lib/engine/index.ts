// Indiana heat pump engine, Steps 1-5 - TypeScript port of hp_engine (Python) and Riley's workbook.
//
//   house (Step 1) -> weather (Step 2) -> loads (Step 3) -> hpRating + equipment (Step 4) -> results (Step 5)
//
// Pure functions, no I/O: the caller passes the data file (see lib/engine-data.ts). Verified cell-for-cell
// against 20 recalculations of Heat_Pump_Calculator.xlsx by tests/engine.parity.test.ts.
import { DEFAULT_ASSUMPTIONS, type Assumptions } from "./assumptions.ts";
import { computeEquipment, computeHpRating, type EquipmentResult, type HPRatingResult } from "./equipment.ts";
import { computeHouse, type HouseResult } from "./house.ts";
import { computeLoads, type LoadsResult } from "./loads.ts";
import { DEFAULT_INPUTS, type CurrentSystem, type EngineData, type HouseInputs } from "./types.ts";
import { computeWeather, type WeatherResult } from "./weather.ts";

export * from "./types.ts";
export { DEFAULT_ASSUMPTIONS, withOverrides, type Assumptions } from "./assumptions.ts";

export type SystemName = CurrentSystem | "Standard heat pump";

export interface SystemEnergy {
  system: SystemName;
  gasTherms: number | null;
  propaneGal: number | null;
  electricityKwh: number;
  heatingMmbtu: number;
  coolingMmbtu: number;
  totalMmbtu: number;
}

export interface ResultsSummary {
  currentSystem: CurrentSystem;
  systems: Record<SystemName, SystemEnergy>;
  /** Heat pump minus current system, as a share of the current system (site energy). Results!B9-B11. */
  change: { total: number; heating: number; cooling: number };
}

export interface EngineResult {
  inputs: HouseInputs;
  house: HouseResult;
  weather: WeatherResult;
  loads: LoadsResult;
  hpRating: HPRatingResult;
  equipment: EquipmentResult;
  results: ResultsSummary;
}

function computeResults(inp: HouseInputs, eq: EquipmentResult, a: Assumptions): ResultsSummary {
  const e = a.equipment, t = eq.totals, fan = eq.fanKwh;
  const kwhMm = e.btuPerKwh / 1e6;
  const mk = (system: SystemName, gas: number | null, prop: number | null, kwh: number, heat: number, cool: number): SystemEnergy =>
    ({ system, gasTherms: gas, propaneGal: prop, electricityKwh: kwh, heatingMmbtu: heat, coolingMmbtu: cool, totalMmbtu: heat + cool });
  const systems: Record<SystemName, SystemEnergy> = {
    "Gas furnace + AC": mk("Gas furnace + AC", t.gasTherms, null, t.acKwh + fan,
      (t.gasTherms * e.btuPerTherm) / 1e6 + fan * kwhMm, t.acKwh * kwhMm),
    "Propane furnace + AC": mk("Propane furnace + AC", null, t.propaneGal, t.acKwh + fan,
      (t.propaneGal * e.btuPerGallonPropane) / 1e6 + fan * kwhMm, t.acKwh * kwhMm),
    "Electric furnace + AC": mk("Electric furnace + AC", null, null, t.elecFurnaceKwh + t.acKwh + fan,
      (t.elecFurnaceKwh + fan) * kwhMm, t.acKwh * kwhMm),
    "Standard heat pump": mk("Standard heat pump", null, null, t.hpHeatKwh + t.backupKwh + t.hpCoolKwh,
      (t.hpHeatKwh + t.backupKwh) * kwhMm, t.hpCoolKwh * kwhMm),
  };
  const cur = systems[inp.current_system], hp = systems["Standard heat pump"];
  return {
    currentSystem: inp.current_system,
    systems,
    change: {
      total: (hp.totalMmbtu - cur.totalMmbtu) / cur.totalMmbtu,
      heating: (hp.heatingMmbtu - cur.heatingMmbtu) / cur.heatingMmbtu,
      cooling: (hp.coolingMmbtu - cur.coolingMmbtu) / cur.coolingMmbtu,
    },
  };
}

/** Run Steps 1-5. Missing inputs fall back to the workbook's opening case. */
export function runEngine(data: EngineData, inputs: Partial<HouseInputs> = {},
  assumptions: Assumptions = DEFAULT_ASSUMPTIONS): EngineResult {
  const inp: HouseInputs = { ...DEFAULT_INPUTS, ...inputs };
  const hp = (assumptions.equipment.heatPumps ?? data.heatPumps)[inp.hp_type];
  const house = computeHouse(inp, assumptions);
  const weather = computeWeather(inp, data);
  const loads = computeLoads(inp, house, weather, assumptions);
  const hpRating = computeHpRating(hp, assumptions);
  const equipment = computeEquipment(inp, loads, hp, hpRating, assumptions);
  const results = computeResults(inp, equipment, assumptions);
  return { inputs: inp, house, weather, loads, hpRating, equipment, results };
}
