"use client";

import { useEffect, useMemo, useState } from "react";
import {
  runCalculator,
  CalcInputs,
  HomeSize,
  Insulation,
  Weather,
  Baseline,
  PriceScenario,
} from "@/lib/calculator";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmt1 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function Calculator({
  onDone,
  onInputsChange,
}: {
  onDone: () => void;
  onInputsChange?: (inputs: CalcInputs) => void;
}) {
  const [inputs, setInputs] = useState<CalcInputs>({
    size: "medium",
    customSqft: 2000,
    insulation: "average",
    ceiling: 8,
    indoorTemp: 68,
    weather: "average",
    baseline: "gas",
    scenario: "flat",
  });

  const results = useMemo(() => runCalculator(inputs), [inputs]);

  // Surface the current settings so the conclusion page / agent can
  // reference what the person actually entered.
  useEffect(() => {
    onInputsChange?.(inputs);
  }, [inputs]);
  const set = <K extends keyof CalcInputs>(k: K, v: CalcInputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  return (
    <section>
      <article className="module-card">
        <h2 className="module-title">Quick estimate</h2>
        <div className="module-summary">
          About one minute. Rough numbers for your situation.
        </div>

        {/* ── inputs ── */}
        <div className="calc-grid">
          <div className="calc-field">
            <label className="calc-label">Home size</label>
            <div className="seg-row">
              {(
                [
                  ["small", "Small ~1,200 ft²"],
                  ["medium", "Medium ~2,000 ft²"],
                  ["large", "Large ~3,000 ft²"],
                  ["custom", "Exact"],
                ] as [HomeSize, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={"seg" + (inputs.size === v ? " on" : "")}
                  onClick={() => set("size", v)}
                >
                  {label}
                </button>
              ))}
            </div>
            {inputs.size === "custom" && (
              <div className="slider-row">
                <input
                  type="range"
                  min={800}
                  max={5000}
                  step={100}
                  value={inputs.customSqft}
                  onChange={(e) => set("customSqft", Number(e.target.value))}
                  aria-label="Square footage"
                />
                <span className="slider-val">{fmt(inputs.customSqft)} ft²</span>
              </div>
            )}
          </div>

          <div className="calc-field">
            <label className="calc-label">Insulation</label>
            <div className="seg-row">
              {(
                [
                  ["poor", "Poor"],
                  ["average", "Average"],
                  ["excellent", "Excellent"],
                ] as [Insulation, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={"seg" + (inputs.insulation === v ? " on" : "")}
                  onClick={() => set("insulation", v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">Ceiling height</label>
            <div className="seg-row">
              {([8, 10] as const).map((v) => (
                <button
                  key={v}
                  className={"seg" + (inputs.ceiling === v ? " on" : "")}
                  onClick={() => set("ceiling", v)}
                >
                  {v} ft
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">
              Winter thermostat: {inputs.indoorTemp}°F
            </label>
            <div className="slider-row">
              <input
                type="range"
                min={64}
                max={74}
                value={inputs.indoorTemp}
                onChange={(e) => set("indoorTemp", Number(e.target.value))}
                aria-label="Winter thermostat setting"
              />
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">Weather year</label>
            <div className="seg-row">
              {(
                [
                  ["mild", "Mild"],
                  ["average", "Average"],
                  ["extreme", "Extreme"],
                ] as [Weather, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={"seg" + (inputs.weather === v ? " on" : "")}
                  onClick={() => set("weather", v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">
              What if energy prices change? (15-year outlook)
            </label>
            <div className="seg-row">
              {(
                [
                  ["flat", "Prices stay level"],
                  ["fossilUp", "Gas/propane rise 3%/yr"],
                  ["elecUp", "Electricity rises 3%/yr"],
                ] as [PriceScenario, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={"seg" + (inputs.scenario === v ? " on" : "")}
                  onClick={() => set("scenario", v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label">Your current system</label>
            <div className="seg-row">
              {(
                [
                  ["gas", "Gas furnace + AC"],
                  ["propane", "Propane + AC"],
                  ["electric", "Electric furnace + AC"],
                ] as [Baseline, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  className={"seg" + (inputs.baseline === v ? " on" : "")}
                  onClick={() => set("baseline", v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── chart ── */}
        <div className="chart-block">
          <div className="chart-title">Monthly energy cost, side by side</div>
          <CostChart baseline={results.baseline} heatPumps={results.heatPumps} />
        </div>

        {/* ── results ── */}
        <div className="result-block">
          <div className="result-baseline">
            <div className="result-baseline-label">
              Your current system · {results.baseline.label}
            </div>
            <div className="result-baseline-stats">
              <span>{fmt1(results.baseline.annualMmbtu)} MMBTU/yr</span>
              <span>~${fmt(results.baseline.monthlyCost)}/mo energy</span>
              <span>{fmt1(results.baseline.annualCo2Tons)} tons CO₂/yr</span>
            </div>
          </div>

          {results.heatPumps.map((hp) => (
            <div key={hp.id} className="result-card">
              <div className="result-name">{hp.label}</div>
              <div className="result-stats">
                <div className="stat">
                  <div className="stat-val">
                    {hp.pctVsBaseline < 0 ? "−" : "+"}
                    {fmt(Math.abs(hp.pctVsBaseline))}%
                  </div>
                  <div className="stat-label">energy vs. current</div>
                </div>
                <div className="stat">
                  <div className="stat-val">
                    {hp.monthlyDelta <= 0 ? "−$" : "+$"}
                    {fmt(Math.abs(hp.monthlyDelta))}
                  </div>
                  <div className="stat-label">monthly bill vs. current</div>
                </div>
                <div className="stat">
                  <div className="stat-val">
                    {fmt1(results.baseline.annualCo2Tons - hp.annualCo2Tons)}
                  </div>
                  <div className="stat-label">tons CO₂ saved/yr</div>
                </div>
                <div className="stat">
                  <div className="stat-val">
                    {hp.breakevenMonth
                      ? `${Math.round(hp.breakevenMonth / 12)} yrs`
                      : " - "}
                  </div>
                  <div className="stat-label">
                    {hp.breakevenMonth
                      ? "to break even on cost"
                      : "no cost breakeven in 15 yrs"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="source-tag">
          <span className="source-pill validated">Estimates</span>
          <span>
            Degree-day model. Energy prices (EIA, IURC) and install cost
            ranges (Indiana market data) validated August 2026. Emissions
            factors still pending EPA eGRID validation. Rebates aren't
            subtracted here — check the rebates page for what applies to
            your project. Not a substitute for a contractor estimate.
          </span>
        </div>
      </article>

      <div className="nav-row">
        <button className="btn btn-primary" onClick={onDone}>
          Continue
        </button>
      </div>
    </section>
  );
}


// ── Simple horizontal bar chart: monthly cost comparison ──

function CostChart({
  baseline,
  heatPumps,
}: {
  baseline: { label: string; monthlyCost: number };
  heatPumps: { id: string; label: string; monthlyCost: number }[];
}) {
  const all = [
    { label: baseline.label, cost: baseline.monthlyCost, isBaseline: true },
    ...heatPumps.map((h) => ({ label: h.label, cost: h.monthlyCost, isBaseline: false })),
  ];
  const max = Math.max(...all.map((a) => a.cost), 1);

  return (
    <div className="chart-bars">
      {all.map((a) => (
        <div key={a.label} className="chart-row">
          <div className="chart-label">{a.label}</div>
          <div className="chart-track">
            <div
              className={"chart-fill" + (a.isBaseline ? " is-baseline" : "")}
              style={{ width: `${(a.cost / max) * 100}%` }}
            />
          </div>
          <div className="chart-value">${a.cost.toFixed(0)}/mo</div>
        </div>
      ))}
    </div>
  );
}
