"use client";

// Integration point for the conversational agent. The placeholder below is
// replaced with the real agent UI; nothing else in the app needs to change.
// See DEVELOPER_GUIDE.md for the context contract and the design constraints.

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
  // Placeholder: replace with the real agent UI.
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
