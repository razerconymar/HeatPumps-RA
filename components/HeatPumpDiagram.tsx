"use client";

import { useState } from "react";

export default function HeatPumpDiagram() {
  const [mode, setMode] = useState<"winter" | "summer">("winter");
  const isWinter = mode === "winter";
  const c = isWinter ? "var(--warm)" : "var(--cool)";

  return (
    <div className="diagram-block">
      <div className="diagram-toggle" role="group" aria-label="Season">
        <button
          className={"seg" + (isWinter ? " on" : "")}
          onClick={() => setMode("winter")}
        >
          Winter: heating
        </button>
        <button
          className={"seg" + (!isWinter ? " on" : "")}
          onClick={() => setMode("summer")}
        >
          Summer: cooling
        </button>
      </div>

      <svg
        viewBox="0 0 620 340"
        className="diagram-svg"
        role="img"
        aria-label={
          isWinter
            ? "Diagram: a heat pump pulls heat from outdoor air and moves it inside the home."
            : "Diagram: a heat pump pulls heat from inside the home and moves it outdoors."
        }
      >
        <defs>
          <marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" fill={c} />
          </marker>
        </defs>

        <text x="310" y="26" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">
          {isWinter
            ? "Winter: heat moves from outside to inside"
            : "Summer: heat moves from inside to outside"}
        </text>

        <line x1="20" y1="286" x2="600" y2="286" stroke="var(--line)" strokeWidth="2" />

        <polygon
          points="55,286 55,170 165,105 275,170 275,286"
          fill="var(--card)"
          stroke="var(--line)"
          strokeWidth="2"
        />
        <text x="165" y="308" textAnchor="middle" fontSize="12.5" fill="var(--ink-faint)">
          Inside your home
        </text>

        <rect x="120" y="212" width="90" height="46" rx="6" fill="var(--paper)" stroke={c} strokeWidth="2" />
        <text x="165" y="240" textAnchor="middle" fontSize="12" fill="var(--ink)">
          Indoor unit
        </text>

        <rect x="430" y="212" width="90" height="74" rx="6" fill="var(--card)" stroke={c} strokeWidth="2" />
        <circle cx="475" cy="249" r="19" fill="none" stroke={c} strokeWidth="1.5" opacity="0.55" />
        <text x="475" y="308" textAnchor="middle" fontSize="12.5" fill="var(--ink-faint)">
          Outdoor unit
        </text>

        <path
          d="M 210 235 L 430 240"
          fill="none"
          stroke={c}
          strokeWidth="2.5"
          strokeDasharray="7 6"
          className="flow-line"
          opacity="0.75"
        />

        {isWinter ? (
          <>
            <path d="M 585 180 L 500 180" stroke={c} strokeWidth="2.5" markerEnd="url(#ah)" fill="none" />
            <text x="585" y="162" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Heat pulled from outdoor air
            </text>
            <path d="M 400 180 L 250 180" stroke={c} strokeWidth="2.5" markerEnd="url(#ah)" fill="none" />
            <text x="400" y="162" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Released indoors as warmth
            </text>
          </>
        ) : (
          <>
            <path d="M 250 180 L 400 180" stroke={c} strokeWidth="2.5" markerEnd="url(#ah)" fill="none" />
            <text x="250" y="162" textAnchor="start" fontSize="12" fill="var(--ink-soft)">
              Heat pulled from indoor air
            </text>
            <path d="M 500 180 L 585 180" stroke={c} strokeWidth="2.5" markerEnd="url(#ah)" fill="none" />
            <text x="585" y="162" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Released outdoors
            </text>
          </>
        )}
      </svg>

      <p className="diagram-caption">
        {isWinter
          ? "Even cold outdoor air holds usable heat. The heat pump captures it outside and releases it indoors, which takes far less energy than burning fuel to create heat."
          : "In summer the same system runs in reverse, pulling heat out of your home and releasing it outdoors, exactly like a standard air conditioner."}
      </p>
    </div>
  );
}
