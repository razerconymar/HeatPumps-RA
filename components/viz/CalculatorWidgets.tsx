"use client";

// Calculator widgets adapted from the heat-pump-agent-sketch concept (Sept 2026):
//   AssumptionsPanel - what the estimate is using, with defaults clearly marked as assumptions
//   BalanceChart     - heat the home needs vs. what the heat pump can deliver, by outdoor temperature
//   PaybackChart     - cumulative cost of ownership over 15 years, with the breakeven point
// All numbers come from runCalculator() -> the Indiana engine; nothing here computes energy.

import { useMemo, useState } from "react";
import { costSensitivity, SENS_THERMOSTATS, SITE_ASSUMPTIONS, thermostatBounds, type CalcInputs,
  type CalcResults } from "@/lib/calculator";
import XYChart from "./XYChart";

const n0 = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });
const n1 = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 1 });
const usd = (v: number) => "$" + n0(v);
const usdK = (v: number) => (v >= 1000 ? `$${n1(v / 1000)}k` : `$${n0(v)}`);

// ───────────────────────────────────────────── Assumptions panel
export function AssumptionsPanel({ inputs, results }: { inputs: CalcInputs; results: CalcResults }) {
  const e = results.engine;
  const eq = e.equipment;
  const d = results.details;
  const chosen: [string, string][] = [
    ["County", `${d.county} · weather from ${d.station}`],
    ["Winter", `${{ mild: "Mild", average: "Typical", extreme: "Severe" }[inputs.weather]} (${d.weatherYear})`],
    ["Home", `${n0(e.house.floorArea)} sq ft · ${e.house.stories} ${e.house.stories === 1 ? "story" : "stories"} · ${inputs.ceiling} ft ceilings`],
    ["Insulation", { poor: "Poor", average: "Average", excellent: "Excellent" }[inputs.insulation]],
    ["Thermostat", (() => {
      const t = thermostatBounds(inputs);
      const f = ([a, b]: [number, number]) => (a === b ? `${a}°F` : `${a}–${b}°F`);
      return `${f(t.heat)} winter · ${f(t.cool)} summer`;
    })()],
    ["Current system", results.baseline.label + (inputs.hasCentralAC ? "" : " (no central AC)")],
  ];
  const assumed: [string, string][] = [
    ["Bedrooms", `${e.house.bedrooms} (from floor area)`],
    ...(inputs.baseline !== "electric"
      ? [["Furnace efficiency", `${Math.round((inputs.baseline === "gas" ? eq.afueGas : eq.afuePropane) * 100)}% (older non-condensing)`] as [string, string]]
      : []),
    ...(inputs.hasCentralAC ? [["Current AC", `${n1(eq.seer2Ac)} SEER2`] as [string, string]] : []),
    ["Heat pump", `${n1(eq.hpTons)} tons · ${n1(eq.seer2Hp)} SEER2 · ${n1(e.hpRating.hspf2)} HSPF2 (median ENERGY STAR)`],
    ["Ducts", `${Math.round(SITE_ASSUMPTIONS.sizing.dse * 100)}% of heat reaches the rooms`],
    ["Energy prices", "$0.17/kWh · $1.15/therm · $2.63/gal (statewide)"],
  ];
  return (
    <aside className="viz-card viz-assume" aria-label="Assumptions used for this estimate">
      <div className="viz-eyebrow">What this estimate is using</div>
      <dl className="viz-rows">
        {chosen.map(([k, v]) => (
          <div key={k} className="viz-row"><dt>{k}</dt><dd>{v}</dd></div>
        ))}
        {assumed.map(([k, v]) => (
          <div key={k} className="viz-row is-assumed"><dt>{k}</dt><dd>{v} <span className="viz-tag">assumed</span></dd></div>
        ))}
      </dl>
      <p className="viz-note">
        Rows marked <em>assumed</em> are defaults for a typical Indiana home, not facts about yours. Change the
        choices above and every number re-runs.
      </p>
    </aside>
  );
}

// ───────────────────────────────────────────── Balance point chart
export function BalanceChart({ results }: { results: CalcResults }) {
  const bins = results.engine.equipment.bins.filter((b) => b.t >= -15 && b.t <= 65);
  const x = bins.map((b) => b.t);
  const need = bins.map((b) => b.heatNeed / 1000);
  const cap = bins.map((b) => b.hpCapacity / 1000);

  // balance point: scanning from warm to cold, where need first rises above capacity
  let balance: { t: number; v: number } | null = null;
  for (let i = bins.length - 1; i > 0; i--) {
    const gHi = need[i] - cap[i], gLo = need[i - 1] - cap[i - 1];
    if (gHi <= 0 && gLo > 0) {
      const f = gHi / (gHi - gLo);
      balance = { t: x[i] + (x[i - 1] - x[i]) * f, v: cap[i] + (cap[i - 1] - cap[i]) * f };
      break;
    }
  }
  const backupHours = results.engine.equipment.bins.reduce((s, b) => s + (b.backup > 0 ? b.hours : 0), 0);
  const share = results.details.backupHeatShare;

  return (
    <section className="viz-card">
      <div className="viz-eyebrow">Heat pump vs. your home, by outdoor temperature</div>
      <h3 className="viz-title">
        {balance
          ? `Below about ${Math.round(balance.t)}°F, electric backup helps out`
          : "The heat pump keeps up at every temperature shown"}
      </h3>
      <p className="viz-sub">
        As it gets colder your home needs more heat while the heat pump can deliver less. Backup covers the gap:
        about {n0(backupHours)} hours in a {results.details.weatherYear.startsWith("Average") ? "typical" : "this"} year,{" "}
        {Math.round(share * 100)}% of the year&apos;s heat.
      </p>
      <XYChart
        x={x}
        series={[
          { key: "need", label: "Your home needs", short: "Home needs", color: "var(--viz-current)", values: need },
          { key: "cap", label: "Heat pump delivers", short: "Heat pump", color: "var(--viz-hp)", values: cap },
        ]}
        band={{ upper: "need", lower: "cap", color: "var(--viz-backup)", label: "Electric backup" }}
        marker={balance ? { x: balance.t, y: balance.v, label: `balance point · ${Math.round(balance.t)}°F` } : null}
        xTicks={[-15, 0, 15, 30, 45, 60]}
        xFormat={(t) => `${n0(t)}°F`}
        yFormat={(v) => `${n0(v)}k`}
        ariaLabel="Line chart: heat the home needs and heat the heat pump can deliver, in thousand Btu per hour, by outdoor temperature"
        tooltipExtra={(i) => (
          <div className="viz-tip-foot">
            {n0(bins[i].hours)} hours/yr at this temperature
            {bins[i].backup > 0 ? ` · backup ${n1(bins[i].backup / 1000)}k Btu/h` : ""}
          </div>
        )}
      />
      <details className="viz-table">
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Outdoor °F</th><th>Hours/yr</th><th>Home needs (Btu/h)</th><th>Heat pump (Btu/h)</th><th>Backup (Btu/h)</th></tr></thead>
          <tbody>
            {bins.slice().reverse().map((b) => (
              <tr key={b.t}><td>{b.t}</td><td>{n0(b.hours)}</td><td>{n0(b.heatNeed)}</td><td>{n0(b.hpCapacity)}</td><td>{n0(b.backup)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="viz-note">Thousand Btu per hour, at the equipment. Heat pump: {n1(results.details.hpTons)}-ton median ENERGY STAR standard unit.</p>
    </section>
  );
}

// ───────────────────────────────────────────── Payback chart
export function PaybackChart({ results }: { results: CalcResults }) {
  const tl = results.timeline;
  const hp = results.heatPumps[0];
  const m = hp.breakevenMonth;
  let marker = null;
  if (m) {
    const yr = m / 12, i = Math.min(tl.length - 1, Math.ceil(yr)), f = yr - (i - 1);
    const y = tl[i - 1].heatPump + (tl[i].heatPump - tl[i - 1].heatPump) * f;
    marker = { x: yr, y, label: `breakeven · year ${n1(yr)}` };
  }
  const gap = tl[tl.length - 1].heatPump - tl[tl.length - 1].current;
  return (
    <section className="viz-card">
      <div className="viz-eyebrow">Cost of ownership over 15 years</div>
      <h3 className="viz-title">
        {m
          ? m <= 12
            ? `The heat pump costs about the same or less from the first year`
            : `The heat pump pays back its extra cost in about ${Math.round(m / 12)} years`
          : `No breakeven within 15 years: about ${usd(Math.abs(gap))} ${gap > 0 ? "more" : "less"} in total`}
      </h3>
      <p className="viz-sub">
        Installed cost plus energy bills, added up year by year. Rebates are not subtracted. Try the price
        scenarios above to see how the lines move.
      </p>
      <XYChart
        x={tl.map((t) => t.year)}
        series={[
          { key: "cur", label: results.baseline.label, short: "Current system", color: "var(--viz-current)", values: tl.map((t) => t.current) },
          { key: "hp", label: "Heat pump", color: "var(--viz-hp)", values: tl.map((t) => t.heatPump) },
        ]}
        marker={marker}
        xTicks={[0, 5, 10, 15]}
        xFormat={(y) => (y === 0 ? "Install" : `Year ${n0(y)}`)}
        yFormat={usdK}
        ariaLabel="Line chart: cumulative cost of the current system and a heat pump over 15 years"
      />
      <details className="viz-table">
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Year</th><th>{results.baseline.label}</th><th>Heat pump</th><th>Difference</th></tr></thead>
          <tbody>
            {tl.map((t) => (
              <tr key={t.year}><td>{t.year}</td><td>{usd(t.current)}</td><td>{usd(t.heatPump)}</td>
                <td>{t.heatPump - t.current >= 0 ? "+" : "−"}{usd(Math.abs(t.heatPump - t.current))}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="viz-note">Placeholder install costs and statewide average prices until utility rates and rebates are added.</p>
    </section>
  );
}

// ───────────────────────────────────────────── Thermostat x energy-price chart
const kTiny = (v: number) => `${v < 0 ? "−" : "+"}${Math.round(Math.abs(v) / 1000)}k`;
const kShort = (v: number) => {
  const a = Math.abs(v) / 1000;
  return `${v < 0 ? "−" : "+"}$${a >= 10 ? a.toFixed(0) : a.toFixed(1)}k`;
};

export function PriceThermostatChart({ inputs, results }: { inputs: CalcInputs; results: CalcResults }) {
  const grid = useMemo(() => costSensitivity(inputs), [inputs]);
  const t = thermostatBounds(inputs);
  const mid = results.thermostat.heat;
  const nearest = SENS_THERMOSTATS.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  const inUserRange = (tHeat: number) =>
    t.heat[0] === t.heat[1] ? tHeat === nearest : tHeat >= t.heat[0] - 1 && tHeat <= t.heat[1] + 1;
  const todayRow = grid.findIndex((r) => r.label === "Today's prices");
  const maxAbs = Math.max(1, ...grid.flatMap((r) => r.cells.map((c) => Math.abs(c.gap))));
  const [focus, setFocus] = useState<{ r: number; c: number } | null>(null);
  const col = SENS_THERMOSTATS.indexOf(nearest);
  const shown = focus ?? { r: todayRow, c: col };
  const cell = grid[shown.r].cells[shown.c];

  const g0 = grid[todayRow].cells[col].gap;
  const ahead = grid.filter((r) => r.cells[col].gap < 0).map((r) => r.label.toLowerCase());
  const title = g0 < 0
    ? `At today's prices and ${nearest}°F, the heat pump saves about ${usd(-g0)} over 15 years`
    : `At today's prices and ${nearest}°F, the heat pump costs about ${usd(g0)} more over 15 years`;
  let sub: string;
  if (ahead.length === 0) sub = "None of these price changes tips the balance toward the heat pump at your thermostat setting.";
  else if (ahead.length === grid.length) sub = "It stays ahead in every price change shown here.";
  else sub = `It comes out ahead with: ${ahead.join(", ")}.`;

  const fill = (gap: number) => {
    const k = Math.min(1, Math.abs(gap) / maxAbs);
    if (k < 0.04) return { background: "var(--viz-neutral)", color: "var(--ink)" };
    // light-to-mid tints only, so dark text stays readable on every square
    const pctMix = Math.round(14 + k * 46);
    return {
      background: `color-mix(in srgb, ${gap < 0 ? "var(--viz-hp)" : "var(--viz-current)"} ${pctMix}%, var(--card))`,
      color: "var(--ink)",
    };
  };

  return (
    <section className="viz-card">
      <div className="viz-eyebrow">Thermostat and energy prices</div>
      <h3 className="viz-title">{title}</h3>
      <p className="viz-sub">
        {sub} Each square is the 15-year cost of the heat pump minus your current system, for a winter thermostat
        setting (across) and a change in energy prices (down).
      </p>
      <div className="viz-legend" aria-hidden="true">
        <span className="viz-legend-item"><span className="heat-swatch" style={{ background: "var(--viz-hp)" }} />Heat pump costs less</span>
        <span className="viz-legend-item"><span className="heat-swatch" style={{ background: "var(--viz-current)" }} />Current system costs less</span>
        <span className="viz-legend-item"><span className="heat-swatch is-you" />Your setting</span>
      </div>
      <div className="heat-grid" role="grid" aria-label="15-year cost difference by winter thermostat and energy price change"
        style={{ gridTemplateColumns: `minmax(72px, 1.4fr) repeat(${SENS_THERMOSTATS.length}, minmax(0, 1fr))` }}
        onMouseLeave={() => setFocus(null)}>
        <div className="heat-corner">Thermostat →</div>
        {SENS_THERMOSTATS.map((th) => (
          <div key={th} className={"heat-colhead" + (inUserRange(th) ? " is-you" : "")}>
            <span className="when-wide">{th}°F</span><span className="when-narrow">{th}°</span>
          </div>
        ))}
        {grid.map((row, r) => (
          <div key={row.label} role="row" style={{ display: "contents" }}>
            <div className={"heat-rowhead" + (r === todayRow ? " is-today" : "")} role="rowheader">{row.label}</div>
            {row.cells.map((c, ci) => {
              const you = r === todayRow && inUserRange(c.tHeat);
              return (
                <button key={c.tHeat} role="gridcell" className={"heat-cell" + (you ? " is-you" : "")} style={fill(c.gap)}
                  onMouseEnter={() => setFocus({ r, c: ci })} onFocus={() => setFocus({ r, c: ci })}
                  onBlur={() => setFocus(null)}
                  aria-label={`${row.label}, ${c.tHeat}°F: heat pump ${c.gap < 0 ? "saves" : "costs"} ${usd(Math.abs(c.gap))} ${c.gap < 0 ? "" : "more "}over 15 years`}>
                  <span className="when-wide">{kShort(c.gap)}</span>
                  <span className="when-narrow">{kTiny(c.gap)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="heat-readout" aria-live="polite">
        <strong>{grid[shown.r].label}, {cell.tHeat}°F:</strong> heat pump {usd(cell.heatPumpTotal)} vs. current{" "}
        {usd(cell.currentTotal)} over 15 years ({cell.gap < 0 ? "saves" : "costs"} {usd(Math.abs(cell.gap))}
        {cell.gap < 0 ? "" : " more"}; {cell.monthlyDelta < 0 ? "−" : "+"}{usd(Math.abs(cell.monthlyDelta))}/month).
      </p>
      <details className="viz-table">
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Energy prices</th>{SENS_THERMOSTATS.map((th) => <th key={th}>{th}°F</th>)}</tr></thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.label}><td>{row.label}</td>
                {row.cells.map((c) => <td key={c.tHeat}>{c.gap < 0 ? "−" : "+"}{usd(Math.abs(c.gap))}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="viz-note">
        Price changes are one-time level shifts from today&apos;s statewide placeholder prices, held for 15 years. Includes
        installed cost; rebates not subtracted.
      </p>
    </section>
  );
}

