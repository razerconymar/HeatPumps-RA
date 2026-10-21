"use client";

// Small, dependency-free line chart used by the calculator widgets.
// - one y-axis, thin 2px lines, recessive grid
// - crosshair snaps to the nearest x; one tooltip lists every series (pointer or arrow keys)
// - optional shaded band between two series (e.g. backup heat) and one annotated marker
// Colours come from CSS variables (--viz-current, --viz-hp, ...) so text-size and high-contrast modes apply.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export interface Series {
  key: string;
  label: string;
  short?: string;       // direct label at the line end (defaults to label)
  color: string;        // CSS colour, usually var(--viz-*)
  values: number[];
  dash?: string;
}

export interface Band {
  upper: string;        // series key
  lower: string;        // series key
  color: string;
  label: string;
}

export interface Marker {
  x: number;
  y: number;
  label: string;
}

interface Props {
  x: number[];
  series: Series[];
  band?: Band;
  marker?: Marker | null;
  xTicks: number[];
  xFormat: (x: number) => string;
  yFormat: (y: number) => string;
  yTickCount?: number;
  ariaLabel: string;
  tooltipExtra?: (i: number) => ReactNode;
  height?: number;
}

const NARROW = 480;   // below this width: no direct labels (the legend carries identity), shorter plot

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => n <= c) ?? 10;
  return step * p;
}

export default function XYChart({
  x, series, band, marker, xTicks, xFormat, yFormat, yTickCount = 4, ariaLabel, tooltipExtra, height = 280,
}: Props) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Render at the real pixel width so text stays readable on phones (no viewBox scaling).
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const narrow = W < NARROW;
  const H = narrow ? Math.round(height * 0.8) : height;
  const PAD = { l: 50, r: narrow ? 14 : 124, t: 16, b: 34 };

  const x0 = Math.min(...x), x1 = Math.max(...x);
  const yMax = niceMax(Math.max(...series.flatMap((s) => s.values), marker?.y ?? 0) * 1.05);
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${sx(x[i]).toFixed(1)},${sy(v).toFixed(1)}`).join("");
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (yMax * i) / yTickCount);

  let bandPath = "";
  if (band) {
    const up = series.find((s) => s.key === band.upper)!.values;
    const lo = series.find((s) => s.key === band.lower)!.values;
    const top = up.map((u, i) => Math.max(u, lo[i]));
    bandPath = top.map((v, i) => `${i ? "L" : "M"}${sx(x[i]).toFixed(1)},${sy(v).toFixed(1)}`).join("")
      + lo.slice().reverse().map((v, j) => `L${sx(x[lo.length - 1 - j]).toFixed(1)},${sy(v).toFixed(1)}`).join("") + "Z";
  }

  function nearest(clientX: number): number {
    const r = svgRef.current!.getBoundingClientRect();
    const vx = ((clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < x.length; i++) if (Math.abs(sx(x[i]) - vx) < Math.abs(sx(x[best]) - vx)) best = i;
    return best;
  }
  const onMove = (e: PointerEvent<SVGRectElement>) => setHover(nearest(e.clientX));
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((h) => Math.min(x.length - 1, Math.max(0, (h ?? 0) + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Escape") setHover(null);
  };

  // direct labels at the right end, nudged apart if they collide
  const ends = series.map((s) => ({ s, y: sy(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;

  const tipLeft = hover === null ? 0 : (sx(x[hover]) / W) * 100;

  return (
    <div className="viz-chart" ref={boxRef}>
      <div className="viz-legend" aria-hidden="true">
        {series.map((s) => (
          <span key={s.key} className="viz-legend-item">
            <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={s.color} strokeWidth="2.5"
              strokeDasharray={s.dash} /></svg>
            {s.label}
          </span>
        ))}
        {band && (
          <span className="viz-legend-item">
            <svg width="14" height="10"><rect width="14" height="10" rx="2" fill={band.color} /></svg>
            {band.label}
          </span>
        )}
      </div>
      <div className="viz-plot">
        <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} tabIndex={0}
          onKeyDown={onKey} onBlur={() => setHover(null)} className="viz-svg">
          <title id={`${id}-t`}>{ariaLabel}</title>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} className={t === 0 ? "viz-baseline" : "viz-grid"} />
              <text x={PAD.l - 8} y={sy(t) + 4} textAnchor="end" className="viz-tick">{yFormat(t)}</text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={sx(t)} y={H - PAD.b + 18} textAnchor="middle" className="viz-tick">{xFormat(t)}</text>
          ))}
          {band && <path d={bandPath} fill={band.color} stroke="none" />}
          {series.map((s) => (
            <path key={s.key} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2}
              strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash} />
          ))}
          {!narrow && ends.map(({ s, y }) => (
            <text key={s.key} x={W - PAD.r + 8} y={y + 4} className="viz-direct">{s.short ?? s.label}</text>
          ))}
          {marker && (
            <g>
              <circle cx={sx(marker.x)} cy={sy(marker.y)} r={5} fill="var(--ink)" stroke="var(--card)" strokeWidth={2} />
              <text x={sx(marker.x)} y={sy(marker.y) - 12}
                textAnchor={sx(marker.x) < PAD.l + 70 ? "start" : sx(marker.x) > W - PAD.r - 70 ? "end" : "middle"}
                className="viz-marker">{marker.label}</text>
            </g>
          )}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={sx(x[hover])} x2={sx(x[hover])} y1={PAD.t} y2={H - PAD.b} className="viz-crosshair" />
              {series.map((s) => (
                <circle key={s.key} cx={sx(x[hover])} cy={sy(s.values[hover])} r={4.5} fill={s.color}
                  stroke="var(--card)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {hover !== null && (
          <div className="viz-tip" style={{ left: `${tipLeft}%`, transform: tipLeft > 55 ? "translateX(-105%)" : "translateX(5%)" }}
            role="status">
            <div className="viz-tip-head">{xFormat(x[hover])}</div>
            {series.map((s) => (
              <div key={s.key} className="viz-tip-row">
                <svg width="12" height="6"><line x1="0" y1="3" x2="12" y2="3" stroke={s.color} strokeWidth="2.5" /></svg>
                <strong>{yFormat(s.values[hover])}</strong>
                <span>{s.label}</span>
              </div>
            ))}
            {tooltipExtra?.(hover)}
          </div>
        )}
      </div>
    </div>
  );
}
