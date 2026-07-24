// ─────────────────────────────────────────────────────────────
// Heat Pump DST — Calculator engine (Basic Mode)
//
// Implements the degree-day model from the Calculator Design
// doc: Q = UA × DD × 24, with insulation / ceiling / thermostat
// multipliers, fuel conversion equations, cost, and GHG.
//
// CALIBRATION: BaseUA is tuned so that a 2,000 sq ft, average-
// insulation home in an average Indiana weather year lands at
// ~60 MMBTU heating and ~15 MMBTU cooling, matching the Energy
// Comparison Estimates document.
//
// DATA STATUS: All prices, emission factors, and install costs
// below are PLACEHOLDER DEFAULTS pending validation against:
//   Prices      → EIA (eia.gov/electricity, /naturalgas, propane)
//   Weather     → NOAA Climate Normals (HDD/CDD by county)
//   HP curves   → NEEP ccASHP database (ashp.neep.org)
//   Emissions   → EPA eGRID + GHG Emission Factors Hub
//   Incentives  → DSIRE (dsireusa.org)
// ─────────────────────────────────────────────────────────────

export type HomeSize = "small" | "medium" | "large" | "custom";
export type Insulation = "poor" | "average" | "excellent";
export type Ceiling = 8 | 10;
export type Weather = "mild" | "average" | "extreme";
export type Baseline = "gas" | "propane" | "electric";
export type HeatPumpType = "ashp" | "ccashp" | "gshp";

export interface CalcInputs {
  size: HomeSize;
  customSqft: number; // used when size === "custom"
  insulation: Insulation;
  ceiling: Ceiling;
  indoorTemp: number; // winter setpoint, 64–74
  weather: Weather;
  baseline: Baseline;
}

// ── constants (placeholder defaults, sources noted above) ──

const SQFT: Record<Exclude<HomeSize, "custom">, number> = {
  small: 1200,
  medium: 2000,
  large: 3000,
};

const WEATHER: Record<Weather, { hdd: number; cdd: number }> = {
  mild: { hdd: 4800, cdd: 850 },
  average: { hdd: 5500, cdd: 1000 },
  extreme: { hdd: 6300, cdd: 1300 },
};

const INSULATION_MULT: Record<Insulation, number> = {
  poor: 1.3,
  average: 1.0,
  excellent: 0.7,
};

// Calibrated so medium/average/average-year ≈ 60 MMBTU heating, 15 cooling
const BASE_UA_HEAT = 455; // BTU/hr·°F at 2000 sqft, average insulation
const BASE_UA_COOL = 625;

// Seasonal efficiencies (Energy Comparison Estimates midpoints)
const SYSTEMS = {
  gas: { label: "Natural gas furnace + AC", afue: 0.9 },
  propane: { label: "Propane heat + AC", afue: 0.9 },
  electric: { label: "Electric furnace + AC", cop: 1.0 },
  ashp: { label: "Standard air-source heat pump", cop: 3.0, seer2: 15.2 },
  ccashp: { label: "Cold-climate heat pump", cop: 2.9, seer2: 15.2 },
  gshp: { label: "Ground-source (geothermal)", cop: 4.0, seer2: 18 },
};
const BASELINE_AC_SEER2 = 14;

// Prices — PLACEHOLDER, validate against EIA
const PRICE = { elecPerKwh: 0.15, gasPerTherm: 1.15, propanePerGal: 2.1 };

// Emission factors — PLACEHOLDER, validate against EPA eGRID / EF Hub
const EF = { elecLbPerKwh: 1.4, gasLbPerTherm: 11.7, propaneLbPerGal: 12.7 };

// Installed cost estimates — PLACEHOLDER, validate with local quotes
const INSTALL: Record<Baseline | HeatPumpType, number> = {
  gas: 11000,
  propane: 11000,
  electric: 9000,
  ashp: 14000,
  ccashp: 17000,
  gshp: 30000,
};

// ── model ──────────────────────────────────────────────────

export interface SystemResult {
  id: Baseline | HeatPumpType;
  label: string;
  annualMmbtu: number;
  pctVsBaseline: number; // negative = uses less energy
  annualCost: number;
  monthlyCost: number;
  monthlyDelta: number; // vs baseline, negative = cheaper
  annualCo2Tons: number;
  installCost: number;
  fifteenYearTotal: number;
  breakevenMonth: number | null; // null = never within 15 yrs (or cheaper from day one)
}

export interface CalcResults {
  baseline: SystemResult;
  heatPumps: SystemResult[];
  heatingLoadMmbtu: number;
  coolingLoadMmbtu: number;
}

export function runCalculator(inputs: CalcInputs): CalcResults {
  const sqft = inputs.size === "custom" ? inputs.customSqft : SQFT[inputs.size];
  const w = WEATHER[inputs.weather];

  // UA adjusted by floor area, insulation, ceiling volume
  const areaMult = sqft / 2000;
  const ceilMult = inputs.ceiling === 10 ? 1.25 : 1.0;
  const insMult = INSULATION_MULT[inputs.insulation];

  // Thermostat: ±2.5% heating demand per °F from 68 (opposite for cooling)
  const tempDelta = inputs.indoorTemp - 68;
  const heatTempMult = 1 + 0.025 * tempDelta;
  const coolTempMult = 1 - 0.025 * tempDelta;

  const uaHeat = BASE_UA_HEAT * areaMult * insMult * ceilMult;
  const uaCool = BASE_UA_COOL * areaMult * insMult * ceilMult;

  const heatingBtu = uaHeat * w.hdd * 24 * heatTempMult;
  const coolingBtu = uaCool * w.cdd * 24 * coolTempMult;

  // ── per-system energy, cost, emissions ──

  function coolingKwh(seer2: number): number {
    return coolingBtu / (seer2 * 1000); // SEER2 = BTU per Wh
  }

  function evalBaseline(b: Baseline): Omit<SystemResult, "pctVsBaseline" | "monthlyDelta" | "fifteenYearTotal" | "breakevenMonth"> {
    const acKwh = coolingKwh(BASELINE_AC_SEER2);
    let heatCost = 0;
    let heatCo2 = 0;
    let heatMmbtuIn = 0;

    if (b === "gas") {
      const therms = heatingBtu / (100000 * SYSTEMS.gas.afue);
      heatCost = therms * PRICE.gasPerTherm;
      heatCo2 = therms * EF.gasLbPerTherm;
      heatMmbtuIn = (therms * 100000) / 1e6;
    } else if (b === "propane") {
      const gallons = heatingBtu / (91500 * SYSTEMS.propane.afue);
      heatCost = gallons * PRICE.propanePerGal;
      heatCo2 = gallons * EF.propaneLbPerGal;
      heatMmbtuIn = (gallons * 91500) / 1e6;
    } else {
      const kwh = heatingBtu / 3412;
      heatCost = kwh * PRICE.elecPerKwh;
      heatCo2 = kwh * EF.elecLbPerKwh;
      heatMmbtuIn = (kwh * 3412) / 1e6;
    }

    const coolCost = acKwh * PRICE.elecPerKwh;
    const coolCo2 = acKwh * EF.elecLbPerKwh;
    const annualCost = heatCost + coolCost;

    return {
      id: b,
      label: SYSTEMS[b].label,
      annualMmbtu: heatMmbtuIn + (acKwh * 3412) / 1e6,
      annualCost,
      monthlyCost: annualCost / 12,
      annualCo2Tons: (heatCo2 + coolCo2) / 2204.6,
      installCost: INSTALL[b],
    };
  }

  function evalHeatPump(hp: HeatPumpType): Omit<SystemResult, "pctVsBaseline" | "monthlyDelta" | "fifteenYearTotal" | "breakevenMonth"> {
    const sys = SYSTEMS[hp];
    const heatKwh = heatingBtu / (sys.cop * 3412);
    const coolKwh = coolingKwh(sys.seer2);
    const totalKwh = heatKwh + coolKwh;
    const annualCost = totalKwh * PRICE.elecPerKwh;

    return {
      id: hp,
      label: sys.label,
      annualMmbtu: (totalKwh * 3412) / 1e6,
      annualCost,
      monthlyCost: annualCost / 12,
      annualCo2Tons: (totalKwh * EF.elecLbPerKwh) / 2204.6,
      installCost: INSTALL[hp],
    };
  }

  const basePartial = evalBaseline(inputs.baseline);
  const baseline: SystemResult = {
    ...basePartial,
    pctVsBaseline: 0,
    monthlyDelta: 0,
    fifteenYearTotal: basePartial.installCost + basePartial.annualCost * 15,
    breakevenMonth: null,
  };

  const heatPumps: SystemResult[] = (["ashp", "ccashp", "gshp"] as HeatPumpType[]).map(
    (hp) => {
      const p = evalHeatPump(hp);
      const monthlyDelta = p.monthlyCost - baseline.monthlyCost;
      const installDelta = p.installCost - baseline.installCost;
      const fifteenYearTotal = p.installCost + p.annualCost * 15;

      // Breakeven: month where cumulative savings offset extra install cost
      let breakevenMonth: number | null = null;
      if (monthlyDelta < 0) {
        const m = Math.ceil(installDelta / -monthlyDelta);
        breakevenMonth = m > 0 && m <= 180 ? m : m <= 0 ? 1 : null;
      }

      return {
        ...p,
        pctVsBaseline:
          ((p.annualMmbtu - baseline.annualMmbtu) / baseline.annualMmbtu) * 100,
        monthlyDelta,
        fifteenYearTotal,
        breakevenMonth,
      };
    }
  );

  return {
    baseline,
    heatPumps,
    heatingLoadMmbtu: heatingBtu / 1e6,
    coolingLoadMmbtu: coolingBtu / 1e6,
  };
}
