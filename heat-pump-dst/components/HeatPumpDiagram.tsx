"use client";

import { useState } from "react";

export default function HeatPumpDiagram() {
  const [mode, setMode] = useState<"winter" | "summer">("winter");
  const isWinter = mode === "winter";
  const flowColor = isWinter ? "var(--warm)" : "var(--cool)";

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
        viewBox="0 0 640 300"
        className="diagram-svg"
        role="img"
        aria-label={
          isWinter
            ? "Diagram showing a heat pump pulling heat from outdoor air and moving it inside the home"
            : "Diagram showing a heat pump pulling heat from inside the home and moving it outside"
        }
      >
        {/* ground */}
        <line x1="10" y1="255" x2="630" y2="255" stroke="var(--line)" strokeWidth="2" />

        {/* house */}
        <g>
          <polygon
            points="60,255 60,150 190,90 320,150 320,255"
            fill="var(--card)"
            stroke="var(--line)"
            strokeWidth="2"
          />
          <text x="190" y="238" textAnchor="middle" fontSize="13" fill="var(--ink-faint)">
            Inside your home
          </text>

          {/* indoor unit */}
          <rect x="130" y="175" width="70" height="46" rx="6" fill="var(--paper)" stroke={flowColor} strokeWidth="2" />
          <text x="165" y="203" textAnchor="middle" fontSize="11" fill="var(--ink)">Indoor unit</text>
        </g>

        {/* outdoor unit */}
        <g>
          <rect x="470" y="190" width="90" height="65" rx="6" fill="var(--card)" stroke={flowColor} strokeWidth="2" />
          <circle cx="515" cy="222" r="18" fill="none" stroke={flowColor} strokeWidth="1.5" opacity="0.6" />
          <text x="515" y="270" textAnchor="middle" fontSize="12" fill="var(--ink-faint)">
            Outdoor unit
          </text>
        </g>

        {/* refrigerant line */}
        <path
          d="M 200 198 L 470 222"
          fill="none"
          stroke={flowColor}
          strokeWidth="3"
          strokeDasharray="8 6"
          className="flow-line"
        />

        {/* arrows: direction depends on mode */}
        {isWinter ? (
          <>
            <path d="M600 222 L560 222" stroke={flowColor} strokeWidth="2.5" markerEnd="url(#arrowHead)" />
            <path d="M330 198 L205 198" stroke={flowColor} strokeWidth="2.5" markerEnd="url(#arrowHead)" />
            <text x="600" y="200" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Heat pulled from outdoor air
            </text>
            <text x="330" y="180" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Moved indoors to warm the house
            </text>
          </>
        ) : (
          <>
            <path d="M205 198 L330 198" stroke={flowColor} strokeWidth="2.5" markerEnd="url(#arrowHead)" />
            <path d="M560 222 L600 222" stroke={flowColor} strokeWidth="2.5" markerEnd="url(#arrowHead)" />
            <text x="205" y="180" textAnchor="start" fontSize="12" fill="var(--ink-soft)">
              Heat pulled from indoor air
            </text>
            <text x="600" y="200" textAnchor="end" fontSize="12" fill="var(--ink-soft)">
              Moved outdoors to cool the house
            </text>
          </>
        )}

        <defs>
          <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={flowColor} />
          </marker>
        </defs>
      </svg>

      <p className="diagram-caption">
        {isWinter
          ? "Even cold outdoor air holds usable heat. The heat pump captures it outside and releases it indoors."
          : "In summer, the same system runs in reverse: it captures heat from inside your home and releases it outdoors, just like a standard air conditioner."}
      </p>
    </div>
  );
}
