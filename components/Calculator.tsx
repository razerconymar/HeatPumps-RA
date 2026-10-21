"use client";

import { useEffect, useMemo, useState } from "react";
import {
  runCalculator,
  DEFAULT_CALC_INPUTS,
  CalcInputs,
  HomeSize,
  Insulation,
  Weather,
  Baseline,
  PriceScenario,
} from "@/lib/calculator";
import { COUNTY_NAMES } from "@/lib/engine-data";
import { AssumptionsPanel, BalanceChart, PaybackChart, PriceThermostatChart } from "@/components/viz/CalculatorWidgets";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmt1 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
const pct = (n: number) => `${Math.round(n * 100)}%`;
const signedUsd = (n: number) => `${n < 0 ? "−" : "+"}$${fmt(Math.abs(n))}`;

export default function Calculator({
  onDone,
  onInputsChange,
}: {
  onDone: () => void;
  onInputsChange?: (inputs: CalcInputs) => void;
}) {
  // Nothing is pre-filled: results stay hidden until the person makes every
  // choice, or loads the Indiana preset as a starting point.
  const [inputs, setInputs] = useState<Partial<CalcInputs>>({
    customSqft: DEFAULT_CALC_INPUTS.customSqft,
    indoorTemp: DEFAULT_CALC_INPUTS.indoorTemp,
    indoorTempHigh: null,
    coolTemp: DEFAULT_CALC_INPUTS.coolTemp,
    coolTempHigh: null,
    scenario: "flat",
  });

  // The choices a person must make before we show any numbers.
  const required: (keyof CalcInputs)[] = [
    "county",
    "size",
    "insulation",
    "ceiling",
    "weather",
    "baseline",
  ];
  const missing = required.filter((k) => inputs[k] === undefined);
  const ready = missing.length === 0;

  const results = useMemo(
    () => (ready ? runCalculator(inputs as CalcInputs) : null),
    [inputs, ready]
  );

  // Surface the current settings so the conclusion page / agent can
  // reference what the person actually entered.
  useEffect(() => {
    if (ready) onInputsChange?.(inputs as CalcInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, ready]);

  function set<K extends keyof CalcInputs>(k: K, v: CalcInputs[K]) {
    setInputs((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <section>
      <article className="module-card">
        <h2 className="module-title">Quick estimate</h2>
        <div className="module-summary">
          About one minute. Rough numbers for your situation.
        </div>

        <div className="preset-row">
          <button
            className="btn btn-ghost btn-small"
            onClick={() => setInputs(DEFAULT_CALC_INPUTS)}
          >
            Give me the typical Indiana house
          </button>
          <span className="preset-hint">
            Loads statewide averages you can adjust, or fill in your own below.
          </span>
        </div>

        {/* ── inputs ── */}
        <div className="calc-grid">
          <div className="calc-field">
            <label className="calc-label">Your current system</label>
            <div className="seg-row">
              {(
                [
                  ["gas", "Gas furnace"],
                  ["propane", "Propane furnace"],
                  ["electric", "Electric furnace"],
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

          <div className="calc-field">
            <label className="calc-label">Do you have central air conditioning?</label>
            <div className="seg-row">
              {([
                [true, "Yes"],
                [false, "No"],
              ] as [boolean, string][]).map(([v, label]) => (
                <button
                  key={label}
                  className={"seg" + (inputs.hasCentralAC === v ? " on" : "")}
                  onClick={() => set("hasCentralAC", v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>


          <div className="calc-field">
            <label className="calc-label" htmlFor="calc-county">County</label>
            <select
              id="calc-county"
              className="calc-select"
              value={inputs.county}
              onChange={(e) => set("county", e.target.value)}
            >
              {COUNTY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="calc-hint">Sets the weather: hourly temperatures from the nearest NOAA station, 2010–2024.</div>
          </div>

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
                  value={inputs.customSqft ?? 2000}
                  onChange={(e) => set("customSqft", Number(e.target.value))}
                  aria-label="Square footage"
                />
                <span className="slider-val">{fmt(inputs.customSqft ?? 2000)} ft²</span>
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

          <ThermostatField
            label="Winter thermostat"
            value={inputs.indoorTemp ?? 68}
            high={inputs.indoorTempHigh ?? null}
            min={55}
            max={78}
            onChange={(v, h) => setInputs((prev) => ({ ...prev, indoorTemp: v, indoorTempHigh: h }))}
          />

          <ThermostatField
            label="Summer thermostat"
            value={inputs.coolTemp ?? 78}
            high={inputs.coolTempHigh ?? null}
            min={66}
            max={85}
            onChange={(v, h) => setInputs((prev) => ({ ...prev, coolTemp: v, coolTempHigh: h }))}
          />

          <div className="calc-field">
            <label className="calc-label">Winter</label>
            <div className="seg-row">
              {(
                [
                  ["mild", "Mild"],
                  ["average", "Typical"],
                  ["extreme", "Severe"],
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
        </div>

        {!ready && (
          <div className="calc-incomplete">
            Choose an option for each question above to see your estimate.
            {missing.length > 0 && (
              <span className="calc-incomplete-count"> {missing.length} left.</span>
            )}
          </div>
        )}

        {ready && results && (
        <>
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
              {inputs.hasCentralAC ? "" : " (no central AC)"}
            </div>
            <div className="result-baseline-stats">
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
                    {hp.monthlyDelta <= 0 ? "−$" : "+$"}
                    {fmt(Math.abs(hp.monthlyDelta))}
                  </div>
                  <div className="stat-label">monthly bill vs. current</div>
                  {results.range && (
                    <div className="stat-range">
                      {signedUsd(results.range.monthlyDelta[0])} to {signedUsd(results.range.monthlyDelta[1])} across
                      your thermostat range
                    </div>
                  )}
                </div>
                <div className="stat">
                  <div className="stat-val">
                    {results.baseline.annualCo2Tons - hp.annualCo2Tons >= 0 ? "" : "+"}
                    {fmt1(Math.abs(results.baseline.annualCo2Tons - hp.annualCo2Tons))}
                  </div>
                  <div className="stat-label">
                    {results.baseline.annualCo2Tons - hp.annualCo2Tons >= 0
                      ? "tons CO₂ saved/yr"
                      : "tons CO₂ added/yr"}
                  </div>
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
              <ul className="result-detail">
                <li>
                  Size: about {fmt1(results.details.hpTons)} tons. Electric backup supplies{" "}
                  {pct(results.details.backupHeatShare)} of the year&apos;s heat (the coldest hours).
                </li>
                <li>
                  Electricity: {fmt(hp.kwh)} kWh/yr, versus{" "}
                  {results.baseline.therms > 0 && `${fmt(results.baseline.therms)} therms + `}
                  {results.baseline.gallons > 0 && `${fmt(results.baseline.gallons)} gallons + `}
                  {fmt(results.baseline.kwh)} kWh today.
                </li>
                {results.details.addsCooling && (
                  <li>
                    Adds air conditioning you don&apos;t have now ({fmt(results.details.heatPumpCoolingKwh)} kWh/yr
                    of the total). That is a comfort gain, not waste.
                  </li>
                )}
              </ul>
            </div>
          ))}

          <div className="result-note">
            Cold-climate and ground-source heat pumps are being added to the new model and will appear
            here soon.
          </div>
        </div>

        <div className="viz-stack">
          <PaybackChart results={results} />
          <PriceThermostatChart inputs={inputs as CalcInputs} results={results} />
          <BalanceChart results={results} />
          <AssumptionsPanel inputs={inputs as CalcInputs} results={results} />
        </div>

        <details className="calc-method">
          <summary>How this estimate is made</summary>
          <ul>
            <li>
              Weather: {results.details.station}
              {results.details.farFromStation
                ? ` (${fmt(results.details.stationDistanceMi)} miles away — the nearest reliable station)`
                : ""}
              , {results.details.weatherYear}.
            </li>
            <li>
              Your home needs about {fmt1(results.heatingLoadMmbtu)} MMBtu of heat and{" "}
              {fmt1(results.coolingLoadMmbtu)} MMBtu of cooling a year, from a physics model of a typical
              house of this size and insulation level (RESNET 301 methods).
            </li>
            <li>
              The heat pump is a median ENERGY STAR standard unit, sized to your cooling load. Its output
              drops as it gets colder; electric backup covers the rest.
            </li>
            <li>
              Energy used at the house: {fmt1(results.baseline.annualMmbtu)} MMBtu/yr today vs.{" "}
              {results.heatPumps.map((h) => fmt1(h.annualMmbtu)).join(", ")} MMBtu/yr with a heat pump.
              Less energy does not always mean a lower bill, because electricity costs more per unit of
              heat than natural gas.
            </li>
          </ul>
        </details>

        <div className="source-tag">
          <span className="source-pill placeholder">Estimates</span>
          <span>
            Energy use comes from the project&apos;s Indiana model (county weather, 2010–2024). Bills,
            emissions and install costs still use single statewide averages ($0.17/kWh, $1.15/therm,
            $2.63/gal) while utility-specific rates are added. Rebates aren&apos;t subtracted here —
            check the rebates page for what applies to your project. Not a substitute for a contractor
            estimate.
          </span>
        </div>
        </>
        )}
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


// ── Thermostat: one setting (slider + typed number) or a range when unsure ──
function ThermostatField({
  label, value, high, min, max, onChange,
}: {
  label: string;
  value: number;
  high: number | null;
  min: number;
  max: number;
  onChange: (value: number, high: number | null) => void;
}) {
  const isRange = high !== null;
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const lo = isRange ? Math.min(value, high!) : value;
  const hi = isRange ? Math.max(value, high!) : value;
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="calc-field">
      <div className="calc-label-row">
        <label className="calc-label" htmlFor={`${id}-a`}>
          {label}: {isRange ? `${lo}–${hi}°F` : `${value}°F`}
        </label>
        <div className="seg-row seg-row-sm" role="group" aria-label={`${label} input type`}>
          <button className={"seg seg-sm" + (!isRange ? " on" : "")} onClick={() => onChange(Math.round((lo + hi) / 2), null)}>
            One setting
          </button>
          <button className={"seg seg-sm" + (isRange ? " on" : "")}
            onClick={() => !isRange && onChange(clamp(value - 2), clamp(value + 2))}>
            Not sure? Give a range
          </button>
        </div>
      </div>

      {!isRange ? (
        <div className="slider-row">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value), null)}
            aria-label={`${label} setting`}
          />
          <NumberBox id={`${id}-a`} value={value} min={min} max={max} onCommit={(v) => onChange(v, null)} label={label} />
        </div>
      ) : (
        <>
          <div className="range-row">
            <span>Between</span>
            <NumberBox id={`${id}-a`} value={lo} min={min} max={max} onCommit={(v) => onChange(v, hi)} label={`${label}, lowest`} />
            <span>and</span>
            <NumberBox id={`${id}-b`} value={hi} min={min} max={max} onCommit={(v) => onChange(lo, v)} label={`${label}, highest`} />
          </div>
          <div className="calc-hint">
            We estimate at the middle ({fmt1((lo + hi) / 2)}°F) and show how much the monthly bill moves across your range.
          </div>
        </>
      )}
    </div>
  );
}

function NumberBox({
  id, value, min, max, onCommit, label,
}: { id: string; value: number; min: number; max: number; onCommit: (v: number) => void; label: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const v = Number(text);
    if (text.trim() === "" || Number.isNaN(v)) { setText(String(value)); return; }
    const c = Math.min(max, Math.max(min, Math.round(v)));
    setText(String(c));
    if (c !== value) onCommit(c);
  };
  return (
    <span className="num-box">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        aria-label={label}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value !== "" && !Number.isNaN(v) && v >= min && v <= max) onCommit(Math.round(v));
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      <span aria-hidden="true">°F</span>
    </span>
  );
}

