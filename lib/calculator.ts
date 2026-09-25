// ─────────────────────────────────────────────────────────────
// Heat Pump DST — Calculator engine (Basic Mode)
// ─────────────────────────────────────────────────────────────

export type HomeSize = "small" | "medium" | "large" | "custom";
export type Insulation = "poor" | "average" | "excellent";
export type Ceiling = 8 | 10;
export type Weather = "mild" | "average" | "extreme";
export type Baseline = "gas" | "propane" | "electric";
export type HeatPumpType = "ashp" | "ccashp" | "gshp";

export type PriceScenario = "flat" | "fossilUp" | "elecUp";
const ESCALATION = 0.03;

export interface CalcInputs {
  size: HomeSize;
  customSqft: number; 
  insulation: Insulation;
  ceiling: Ceiling;
  indoorTemp: number; 
  weather: Weather;
  baseline: Baseline;
  scenario: PriceScenario;
}


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


const BASE_UA_HEAT = 455; 
const BASE_UA_COOL = 625;


const SYSTEMS = {
  gas: { label: "Natural gas furnace + AC", afue: 0.9 },
  propane: { label: "Propane heat + AC", afue: 0.9 },
  electric: { label: "Electric furnace + AC", cop: 1.0 },
  ashp: { label: "Standard air-source heat pump", cop: 3.0, seer2: 15.2 },
  ccashp: { label: "Cold-climate heat pump", cop: 2.9, seer2: 15.2 },
  gshp: { label: "Ground-source (geothermal)", cop: 4.0, seer2: 18 },
};
const BASELINE_AC_SEER2 = 14;


const PRICE = { elecPerKwh: 0.17, gasPerTherm: 1.15, propanePerGal: 2.63 };

const EF = { elecLbPerKwh: 1.4, gasLbPerTherm: 11.7, propaneLbPerGal: 12.7 };


const INSTALL: Record<Baseline | HeatPumpType, number> = {
  gas: 10000,
  propane: 10000,
  electric: 8500,
  ashp: 10500,
  ccashp: 13000,
  gshp: 27000,
};

// ── model ──────────────────────────────────────────────────

export interface SystemResult {
  id: Baseline | HeatPumpType;
  label: string;
  annualMmbtu: number;
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
  heatingLoadMmbtu: number;
  coolingLoadMmbtu: number;
}

export function runCalculator(inputs: CalcInputs): CalcResults {
  const sqft = inputs.size === "custom" ? inputs.customSqft : SQFT[inputs.size];
  const w = WEATHER[inputs.weather];

 
  const areaMult = sqft / 2000;
  const ceilMult = inputs.ceiling === 10 ? 1.25 : 1.0;
  const insMult = INSULATION_MULT[inputs.insulation];

 
  const tempDelta = inputs.indoorTemp - 68;
  const heatTempMult = 1 + 0.025 * tempDelta;
  const coolTempMult = 1 - 0.025 * tempDelta;

  const uaHeat = BASE_UA_HEAT * areaMult * insMult * ceilMult;
  const uaCool = BASE_UA_COOL * areaMult * insMult * ceilMult;

  const heatingBtu = uaHeat * w.hdd * 24 * heatTempMult;
  const coolingBtu = uaCool * w.cdd * 24 * coolTempMult;

  // ── per-system energy, cost, emissions ──

  function coolingKwh(seer2: number): number {
    return coolingBtu / (seer2 * 1000); 
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


  function yearMult(kind: "elec" | "fossil", year: number): number {
    const s = inputs.scenario;
    if (s === "flat") return 1;
    if (s === "fossilUp") return kind === "fossil" ? Math.pow(1 + ESCALATION, year) : 1;
    return kind === "elec" ? Math.pow(1 + ESCALATION, year) : 1;
  }

  // Baseline cost split: how much of the annual cost rides on each fuel
  function baselineCostSplit(b: Baseline): { elec: number; fossil: number } {
    const acKwh = coolingKwh(BASELINE_AC_SEER2);
    const coolCost = acKwh * PRICE.elecPerKwh;
    if (b === "gas") {
      const therms = heatingBtu / (100000 * SYSTEMS.gas.afue);
      return { elec: coolCost, fossil: therms * PRICE.gasPerTherm };
    }
    if (b === "propane") {
      const gallons = heatingBtu / (91500 * SYSTEMS.propane.afue);
      return { elec: coolCost, fossil: gallons * PRICE.propanePerGal };
    }
    const kwh = heatingBtu / 3412;
    return { elec: coolCost + kwh * PRICE.elecPerKwh, fossil: 0 };
  }

  const basePartial = evalBaseline(inputs.baseline);
  const baseSplit = baselineCostSplit(inputs.baseline);

  function baselineYearCost(year: number): number {
    return (
      baseSplit.elec * yearMult("elec", year) +
      baseSplit.fossil * yearMult("fossil", year)
    );
  }

  let baseFifteen = basePartial.installCost;
  for (let y = 0; y < 15; y++) baseFifteen += baselineYearCost(y);

  const baseline: SystemResult = {
    ...basePartial,
    pctVsBaseline: 0,
    monthlyDelta: 0,
    fifteenYearTotal: baseFifteen,
    breakevenMonth: null,
  };

  const heatPumps: SystemResult[] = (["ashp", "ccashp", "gshp"] as HeatPumpType[]).map(
    (hp) => {
      const p = evalHeatPump(hp);
      const monthlyDelta = p.monthlyCost - baseline.monthlyCost;
      const installDelta = p.installCost - baseline.installCost;

      let fifteenYearTotal = p.installCost;
      for (let y = 0; y < 15; y++) {
        fifteenYearTotal += p.annualCost * yearMult("elec", y);
      }

      // Breakeven: first month where cumulative total cost (install +
      // escalated operating) drops below the baseline's cumulative total
      let breakevenMonth: number | null = null;
      let hpCum = p.installCost;
      let baseCum = basePartial.installCost;
      for (let m = 1; m <= 180 && breakevenMonth === null; m++) {
        const y = Math.floor((m - 1) / 12);
        hpCum += (p.annualCost * yearMult("elec", y)) / 12;
        baseCum += baselineYearCost(y) / 12;
        if (hpCum <= baseCum) breakevenMonth = m;
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
