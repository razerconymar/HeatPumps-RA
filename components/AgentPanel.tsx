"use client";

// ═════════════════════════════════════════════════════════════
// AGENT INTEGRATION SLOT
//
// ─────────────────────────────────────────────────────────────
// WHAT YOU GET 
// ─────────────────────────────────────────────────────────────
//
//   context.pagesVisited   string[]  page codes in visit order,
//                                    e.g. ["1A","1B","CALC","1E"]
//   context.pageTitles     string[]  same list, human-readable
//   context.entryQuestion  string    the question they picked first
//   context.usedCalculator boolean   whether they opened the calculator
//   context.calculatorInputs object | null
//                                    their last calculator settings
//                                    (home size, insulation, current
//                                    system, etc.) if they used it
//   context.timeSpentSeconds number  total time in the tool
//   context.sessionToken   string    anonymous id, no personal info
//
// That context exists so the agent can open with something
// specific rather than a blank prompt. Someone who spent their
// whole visit in the money thread and ran the calculator should
// get a different opening line than someone who only read the
// basics.
//
// ─────────────────────────────────────────────────────────────
// NOTES FOR WHOEVER BUILDS THIS
// ─────────────────────────────────────────────────────────────
//
// • No personal information is available here, by design. The
//   session token is random and not tied to any identity. Please
//   keep it that way — do not add name/email collection.
//
// • The app has a text-size control and a high-contrast mode.
//   If you use the existing CSS variables (--ink, --card, --line,
//   --pine, etc.) and wrap font sizes in
//   calc(Npx * var(--text-scale, 1)), the agent will inherit both
//   automatically.
//
// • If the agent needs to log conversations for research, add a
//   logger alongside the existing ones in lib/instrumentation.ts
//   so it flows into the same CSV/JSON export.
// ═════════════════════════════════════════════════════════════

export interface AgentContext {
  pagesVisited: string[];
  pageTitles: string[];
  entryQuestion: string;
  usedCalculator: boolean;
  calculatorInputs: Record<string, unknown> | null;
  timeSpentSeconds: number;
  sessionToken: string;
}

export default function AgentPanel({ context }: { context: AgentContext }) {
  // ═══════════════════════════════════════════════════════════
  // REPLACE EVERYTHING BELOW THIS LINE WITH THE REAL AGENT
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="agent-slot">
      <div className="agent-slot-badge">Coming soon</div>
      <h3 className="agent-slot-title">Still have questions?</h3>
      <p className="agent-slot-text">
        A guided assistant will go here, so you can ask follow-up questions
        about your own home in your own words.
      </p>

      <details className="agent-slot-debug">
        <summary>Session context available to the agent</summary>
        <ul>
          <li>
            <strong>Started with:</strong>{" "}
            {context.entryQuestion || "not recorded"}
          </li>
          <li>
            <strong>Pages visited:</strong>{" "}
            {context.pageTitles.length > 0
              ? context.pageTitles.join(" → ")
              : "none"}
          </li>
          <li>
            <strong>Used calculator:</strong>{" "}
            {context.usedCalculator ? "yes" : "no"}
          </li>
          <li>
            <strong>Time in tool:</strong>{" "}
            {Math.round(context.timeSpentSeconds / 60)} min
          </li>
          <li>
            <strong>Session:</strong> <code>{context.sessionToken}</code>
          </li>
        </ul>
        <p className="agent-slot-note">
          This panel is only visible during development so the integration
          point is easy to see. Remove it when the agent is wired in.
        </p>
      </details>
    </div>
  );
}
