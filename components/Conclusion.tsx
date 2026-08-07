"use client";

import AgentPanel, { AgentContext } from "./AgentPanel";

// ─────────────────────────────────────────────────────────────
// Conclusion page
//
// Shown at the very end of a visit, after the post-survey in a
// research session or after the quick feedback question for a
// casual visitor.
//
// Purpose: send people away with something concrete rather than a
// dead end. Recaps what they covered, gives real next steps, and
// hosts the conversational agent (see AgentPanel.tsx).
// ─────────────────────────────────────────────────────────────

export interface ConclusionProps {
  context: AgentContext;
  studyMode: boolean;
  onNavigate: (target: string) => void;
  onRestart: () => void;
}

export default function Conclusion({
  context,
  studyMode,
  onNavigate,
  onRestart,
}: ConclusionProps) {
  const covered = context.pageTitles.length;

  return (
    <section className="conclusion">
      <h1 className="hero-title">
        {studyMode ? "All done, thank you" : "Where to go from here"}
      </h1>
      <p className="hero-lede">
        {studyMode
          ? "Your responses have been recorded. Please let the facilitator know you have finished. Before you go, here is a recap and a few next steps."
          : "You have covered a lot. Here is a recap, and some concrete things you can do next."}
      </p>

      {/* ── recap ── */}
      {covered > 0 && (
        <div className="recap-card">
          <div className="recap-heading">What you looked at</div>
          <ul className="recap-list">
            {context.pageTitles.slice(0, 8).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
            {covered > 8 && <li>and {covered - 8} more</li>}
          </ul>
          {context.usedCalculator && (
            <div className="recap-note">
              You ran the cost estimate. Remember that those figures are
              planning estimates, not a quote, and that rebates apply on top of
              them.
            </div>
          )}
        </div>
      )}

      {/* ── agent slot ── */}
      <AgentPanel context={context} />

      {/* ── next steps ── */}
      <div className="related-block">
        <div className="related-label">Practical next steps</div>
        <div className="next-links">
          <button
            className="next-link"
            onClick={() => onNavigate("FIND_REBATES")}
          >
            <span className="next-link-label">
              Check which rebates you qualify for
            </span>
            <span className="next-arrow" aria-hidden>
              &rarr;
            </span>
          </button>
          <button className="next-link" onClick={() => onNavigate("3C")}>
            <span className="next-link-label">
              Print the contractor questions to take with you
            </span>
            <span className="next-arrow" aria-hidden>
              &rarr;
            </span>
          </button>
          <button
            className="next-link"
            onClick={() => onNavigate("FIND_CONTRACTORS")}
          >
            <span className="next-link-label">Find a qualified installer</span>
            <span className="next-arrow" aria-hidden>
              &rarr;
            </span>
          </button>
        </div>
      </div>

      {!studyMode && (
        <div className="nav-row">
          <button className="btn btn-ghost" onClick={onRestart}>
            Start over
          </button>
          <span />
        </div>
      )}
    </section>
  );
}
