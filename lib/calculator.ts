// ─────────────────────────────────────────────────────────────
// Heat Pump DST — Calculator (Basic Mode)
//
// Energy comes from the Indiana engine (lib/engine), a tested port of Riley's workbook
// (Heat_Pump_Calculator.xlsx, Steps 1-5): county weather in 5°F ranges, a physics model of the
// house, heat pump sizing, electric backup, and the three current systems.
//
// Cost, CO₂, install cost and payback are still the simple placeholder layer from the previous
// version of this file, now applied to the engine's kWh / therms / gallons. They get replaced by
// Steps 6-8 (tariff bills, 15-year present value, eGRID/Cambium emissions).
// ─────────────────────────────────────────────────────────────
import { ENGINE_DATA } from "@/lib/engine-data";
import {
  DEFAULT_ASSUMPTIONS,
  runEngine,
  type Assumptions,
  type CurrentSystem,
  type EngineResult,
  type WeatherYear,
} from "@/lib/engine/index.ts";

export type HomeSize = "small" | "medium" | "large" | "custom";
export type Insulation = "poor" | "average" | "excellent";
export type Ceiling = 8 | 10;
export type Weather = "mild" | "average" | "extreme";
export type Baseline = "gas" | "propane" | "electric";
export type HeatPumpType = "ashp" | "ccashp" | "gshp";
export type PriceScenario = "flat" | "fossilUp" | "elecUp";

export interface CalcInputs {
  county: string;
  size: HomeSize;
  customSqft: number;
  insulation: Insulation;
  ceiling: Ceiling;
  indoorTemp: number;             // winter thermostat, °F (low end when a range is given)
  indoorTempHigh: number | null;  // high end of the winter range, or null for a single setting
  coolTemp: number;               // summer thermostat, °F (low end when a range is given)
  coolTempHigh: number | null;    // high end of the summer range, or null
  weather: Weather;
  baseline: Baseline;
  hasCentralAC: boolean;
  scenario: PriceScenario;
}

export const DEFAULT_CALC_INPUTS: CalcInputs = {
  county: "Marion",
  size: "medium",
  customSqft: 2000,
  insulation: "average",
  ceiling: 8,
  indoorTemp: 68,
  indoorTempHigh: null,
  coolTemp: 78,
  coolTempHigh: null,
  weather: "average",
  baseline: "gas",
  hasCentralAC: true,
  scenario: "flat",
};

/**
 * Engine settings for the site. Equal to the workbook today, so the site matches Riley's numbers.
 * The team's open decisions (existing furnace AFUE, existing AC SEER2, outside shading, sizing) are
 * changed here with withOverrides(), e.g. withOverrides({ sun: { exteriorShading: 0.7 } }).
 */
export const SITE_ASSUMPTIONS: Assumptions = DEFAULT_ASSUMPTIONS;

// ── placeholder cost / emissions layer: statewide averages, not utility rates ──
const ESCALATION = 0.03;
const PRICE = { elecPerKwh: 0.17, gasPerTherm: 1.15, propanePerGal: 2.63 };
const EF = { elecLbPerKwh: 1.4, gasLbPerTherm: 11.7, propaneLbPerGal: 12.7 };
const INSTALL: Record<Baseline | HeatPumpType, number> = {
  gas: 10000, propane: 10000, electric: 8500, ashp: 10500, ccashp: 13000, gshp: 27000,
};

const LABEL: Record<Baseline | "ashp", string> = {
  gas: "Natural gas furnace",
  propane: "Propane furnace",
  electric: "Electric furnace",
  ashp: "Standard air-source heat pump",
};
const ENGINE_SYSTEM: Record<Baseline, CurrentSystem> = {
  gas: "Gas furnace + AC", propane: "Propane furnace + AC", electric: "Electric furnace + AC",
};
const ENGINE_YEAR: Record<Weather, WeatherYear> = { mild: "Mild", average: "Average", extreme: "Extreme" };
const ENGINE_LEVEL = { poor: "Poor", average: "Average", excellent: "Excellent" } as const;
const ENGINE_SIZE = { small: "Small", medium: "Medium", large: "Large", custom: "Exact" } as const;

export interface SystemResult {
  id: Baseline | HeatPumpType;
  label: string;
  kwh: number;
  therms: number;
  gallons: number;
  annualMmbtu: number;      // site energy - supporting detail only, not a headline
  pctVsBaseline: number;
  annualCost: number;
  monthlyCost: number;
  monthlyDelta: number;
  annualCo2Tons: number;
  installCost: number;
  fifteenYearTotal: number;
  breakevenMonth: number | null;
}

export interface CalcResults {
  baseline: SystemResult;
  heatPumps: SystemResult[];
  heatingLoadMmbtu: number;   // at the rooms
  coolingLoadMmbtu: number;
  /** Cumulative cost (install + energy) at the end of each year, 0..15, for the payback chart. */
  timeline: { year: number; current: number; heatPump: number }[];
  details: {
    county: string;
    station: string;
    stationDistanceMi: number;
    farFromStation: boolean;
    weatherYear: string;
    hpTons: number;
    backupHeatShare: number;
    designCoverage: number;
    addsCooling: boolean;      // home has no central AC today
    heatPumpCoolingKwh: number;
  };
  engine: EngineResult;
  /** Thermostat settings actually used (the middle of any range). */
  thermostat: { heat: number; cool: number };
  /** When the person gave a thermostat range: results at the cheap and expensive ends of it. */
  range: null | {
    monthlyDelta: [number, number];       // heat pump minus current, $/month
    fifteenYearGap: [number, number];     // heat pump minus current, 15-year total
    baselineMonthly: [number, number];
    heatPumpMonthly: [number, number];
  };
}

/** A level change in energy prices held for 15 years (1 = today's placeholder price). */
export interface PriceFactor { elec: number; fossil: number }
const TODAY: PriceFactor = { elec: 1, fossil: 1 };

/** Low and high ends of a thermostat input (equal when it is a single setting). */
export function thermostatBounds(inputs: CalcInputs) {
  const span = (lo: number, hi: number | null): [number, number] =>
    hi === null ? [lo, lo] : [Math.min(lo, hi), Math.max(lo, hi)];
  return { heat: span(inputs.indoorTemp, inputs.indoorTempHigh), cool: span(inputs.coolTemp, inputs.coolTempHigh) };
}

const engineCache = new Map<string, EngineResult>();
function engineFor(inputs: CalcInputs, tHeat: number, tCool: number): EngineResult {
  const key = [inputs.county, inputs.weather, inputs.size, inputs.customSqft, inputs.ceiling, inputs.insulation,
    tHeat, tCool, inputs.baseline].join("|");
  let r = engineCache.get(key);
  if (!r) {
    r = runEngine(ENGINE_DATA, {
      county: inputs.county,
      weather_year: ENGINE_YEAR[inputs.weather],
      size: ENGINE_SIZE[inputs.size],
      exact_area_sqft: inputs.customSqft,
      ceiling_ft: inputs.ceiling,
      level: ENGINE_LEVEL[inputs.insulation],
      t_heat_f: tHeat,
      t_cool_f: tCool,
      current_system: ENGINE_SYSTEM[inputs.baseline],
    }, SITE_ASSUMPTIONS);
    if (engineCache.size > 300) engineCache.clear();
    engineCache.set(key, r);
  }
  return r;
}

export function runCalculator(inputs: CalcInputs): CalcResults {
  const t = thermostatBounds(inputs);
  const mid = { heat: (t.heat[0] + t.heat[1]) / 2, cool: (t.cool[0] + t.cool[1]) / 2 };
  const main = computeAt(inputs, mid.heat, mid.cool, TODAY, inputs.scenario);
  if (t.heat[0] === t.heat[1] && t.cool[0] === t.cool[1]) return main;
  // Cheapest end: lowest winter setting + highest summer setting; costliest end: the reverse.
  const lo = computeAt(inputs, t.heat[0], t.cool[1], TODAY, inputs.scenario);
  const hi = computeAt(inputs, t.heat[1], t.cool[0], TODAY, inputs.scenario);
  const pair = (f: (r: CalcResults) => number): [number, number] => {
    const a = f(lo), b = f(hi);
    return [Math.min(a, b), Math.max(a, b)];
  };
  return {
    ...main,
    range: {
      monthlyDelta: pair((r) => r.heatPumps[0].monthlyDelta),
      fifteenYearGap: pair((r) => r.heatPumps[0].fifteenYearTotal - r.baseline.fifteenYearTotal),
      baselineMonthly: pair((r) => r.baseline.monthlyCost),
      heatPumpMonthly: pair((r) => r.heatPumps[0].monthlyCost),
    },
  };
}

/** Rows and columns of the thermostat x energy-price chart. */
export const SENS_THERMOSTATS = [64, 66, 68, 70, 72, 74];
export const SENS_PRICES: { label: string; factor: PriceFactor }[] = [
  { label: "Gas/propane +30%", factor: { elec: 1, fossil: 1.3 } },
  { label: "Gas/propane +15%", factor: { elec: 1, fossil: 1.15 } },
  { label: "Today's prices", factor: TODAY },
  { label: "Electricity +15%", factor: { elec: 1.15, fossil: 1 } },
  { label: "Electricity +30%", factor: { elec: 1.3, fossil: 1 } },
];

/**
 * 15-year cost difference (heat pump minus current system) for each winter thermostat setting and
 * each level change in energy prices. Negative = the heat pump costs less. Prices are held flat for
 * 15 years in this view (the escalation scenario buttons drive the payback chart instead).
 */
export function costSensitivity(inputs: CalcInputs) {
  const cool = (thermostatBounds(inputs).cool[0] + thermostatBounds(inputs).cool[1]) / 2;
  return SENS_PRICES.map((row) => ({
    label: row.label,
    cells: SENS_THERMOSTATS.map((tHeat) => {
      const r = computeAt(inputs, tHeat, cool, row.factor, "flat");
      return {
        tHeat,
        gap: r.heatPumps[0].fifteenYearTotal - r.baseline.fifteenYearTotal,
        currentTotal: r.baseline.fifteenYearTotal,
        heatPumpTotal: r.heatPumps[0].fifteenYearTotal,
        monthlyDelta: r.heatPumps[0].monthlyDelta,
      };
    }),
  }));
}

function computeAt(inputs: CalcInputs, tHeat: number, tCool: number, pf: PriceFactor,
  scenario: PriceScenario): CalcResults {
  const engine = engineFor(inputs, tHeat, tCool);
  const P = { elecPerKwh: PRICE.elecPerKwh * pf.elec, gasPerTherm: PRICE.gasPerTherm * pf.fossil,
    propanePerGal: PRICE.propanePerGal * pf.fossil };

  const eq = engine.equipment;
  const kwhMm = SITE_ASSUMPTIONS.equipment.btuPerKwh / 1e6;
  const acKwh = inputs.hasCentralAC ? eq.totals.acKwh : 0;

  // ── current system: fuel for heat, electricity for AC (if any) and the furnace fan ──
  const b = inputs.baseline;
  const therms = b === "gas" ? eq.totals.gasTherms : 0;
  const gallons = b === "propane" ? eq.totals.propaneGal : 0;
  const baseKwh = (b === "electric" ? eq.totals.elecFurnaceKwh : 0) + acKwh + eq.fanKwh;
  const baseFossilCost = therms * P.gasPerTherm + gallons * P.propanePerGal;
  const baseElecCost = baseKwh * P.elecPerKwh;
  const baseMmbtu = (therms * SITE_ASSUMPTIONS.equipment.btuPerTherm + gallons * SITE_ASSUMPTIONS.equipment.btuPerGallonPropane) / 1e6
    + baseKwh * kwhMm;
  const baseCo2Lb = therms * EF.gasLbPerTherm + gallons * EF.propaneLbPerGal + baseKwh * EF.elecLbPerKwh;

  // ── standard heat pump: heating + electric backup + cooling ──
  const hpKwh = eq.heatPumpKwh;
  const hpCost = hpKwh * P.elecPerKwh;

  const yearMult = (kind: "elec" | "fossil", year: number) => {
    if (scenario === "flat") return 1;
    const rising = scenario === "fossilUp" ? "fossil" : "elec";
    return kind === rising ? Math.pow(1 + ESCALATION, year) : 1;
  };
  const baseYearCost = (y: number) => baseElecCost * yearMult("elec", y) + baseFossilCost * yearMult("fossil", y);

  let baseFifteen = INSTALL[b];
  for (let y = 0; y < 15; y++) baseFifteen += baseYearCost(y);

  const baseline: SystemResult = {
    id: b, label: LABEL[b] + (inputs.hasCentralAC ? " + AC" : ""), kwh: baseKwh, therms, gallons, annualMmbtu: baseMmbtu, pctVsBaseline: 0,
    annualCost: baseFossilCost + baseElecCost, monthlyCost: (baseFossilCost + baseElecCost) / 12, monthlyDelta: 0,
    annualCo2Tons: baseCo2Lb / 2204.6, installCost: INSTALL[b], fifteenYearTotal: baseFifteen, breakevenMonth: null,
  };

  let hpFifteen = INSTALL.ashp;
  for (let y = 0; y < 15; y++) hpFifteen += hpCost * yearMult("elec", y);
  let breakevenMonth: number | null = null;
  let hpCum = INSTALL.ashp, baseCum = INSTALL[b];
  const timeline = [{ year: 0, current: baseCum, heatPump: hpCum }];
  for (let m = 1; m <= 180; m++) {
    const y = Math.floor((m - 1) / 12);
    hpCum += (hpCost * yearMult("elec", y)) / 12;
    baseCum += baseYearCost(y) / 12;
    if (breakevenMonth === null && hpCum <= baseCum) breakevenMonth = m;
    if (m % 12 === 0) timeline.push({ year: m / 12, current: baseCum, heatPump: hpCum });
  }
  const hpMmbtu = hpKwh * kwhMm;
  const heatPump: SystemResult = {
    id: "ashp", label: LABEL.ashp, kwh: hpKwh, therms: 0, gallons: 0, annualMmbtu: hpMmbtu,
    pctVsBaseline: ((hpMmbtu - baseMmbtu) / baseMmbtu) * 100, annualCost: hpCost, monthlyCost: hpCost / 12,
    monthlyDelta: hpCost / 12 - baseline.monthlyCost, annualCo2Tons: (hpKwh * EF.elecLbPerKwh) / 2204.6,
    installCost: INSTALL.ashp, fifteenYearTotal: hpFifteen, breakevenMonth,
  };

  return {
    baseline,
    heatPumps: [heatPump],
    timeline,
    heatingLoadMmbtu: engine.loads.heatAnnualMmbtu,
    coolingLoadMmbtu: engine.loads.coolAnnualMmbtu,
    details: {
      county: engine.weather.county,
      station: engine.weather.station,
      stationDistanceMi: engine.weather.distanceMi,
      farFromStation: engine.weather.farMatch,
      weatherYear: engine.weather.whichYear,
      hpTons: eq.hpTons,
      backupHeatShare: eq.backupHeatShare,
      designCoverage: eq.designCoverage,
      addsCooling: !inputs.hasCentralAC,
      heatPumpCoolingKwh: eq.totals.hpCoolKwh,
    },
    engine,
    thermostat: { heat: tHeat, cool: tCool },
    range: null,
  };
}
