"use client";

import { useState } from "react";
import { Question } from "@/data/survey-questions";

export type SurveyAnswers = Record<string, unknown>;

export default function Survey({
  title,
  intro,
  questions,
  submitLabel,
  onComplete,
}: {
  title: string;
  intro: string;
  questions: Question[];
  submitLabel: string;
  onComplete: (answers: SurveyAnswers) => void;
}) {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [showErrors, setShowErrors] = useState(false);

  function set(id: string, value: unknown) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function isAnswered(q: Question): boolean {
    if (q.optional) return true;
    const v = answers[q.id];
    if (v === undefined || v === null || v === "") return false;
    if (q.type === "rank") {
      const r = v as Record<string, number>;
      const used = Object.values(r).filter((n) => n > 0);
      return used.length === (q.options?.length ?? 0);
    }
    if (q.type === "magnitude") {
      const m = v as Record<string, string>;
      return Object.values(m).some((x) => x !== "");
    }
    return true;
  }

  const missing = questions.filter((q) => !isAnswered(q));

  function handleSubmit() {
    if (missing.length > 0) {
      setShowErrors(true);
      const el = document.getElementById(`q-${missing[0].id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onComplete(answers);
  }

  return (
    <section>
      <h1 className="hero-title">{title}</h1>
      <p className="hero-lede">{intro}</p>

      <div className="survey-list">
        {questions.map((q, i) => {
          const bad = showErrors && !isAnswered(q);
          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={"survey-q" + (bad ? " invalid" : "")}
            >
              <div className="survey-q-head">
                <span className="survey-q-num">{i + 1}</span>
                <div>
                  <div className="survey-q-prompt">
                    {q.prompt}
                    {q.optional && <span className="survey-optional">optional</span>}
                  </div>
                  {q.help && <div className="survey-q-help">{q.help}</div>}
                </div>
              </div>

              <div className="survey-q-body">
                {q.type === "likert" && (
                  <LikertInput
                    value={answers[q.id] as number | undefined}
                    labels={q.scaleLabels ?? ["Low", "High"]}
                    scale={q.scale}
                    onChange={(n) => set(q.id, n)}
                  />
                )}
                {q.type === "single" && (
                  <SingleInput
                    options={q.options ?? []}
                    value={answers[q.id] as string | undefined}
                    onChange={(v) => set(q.id, v)}
                  />
                )}
                {q.type === "rank" && (
                  <RankInput
                    options={q.options ?? []}
                    value={(answers[q.id] as Record<string, number>) ?? {}}
                    onChange={(v) => set(q.id, v)}
                  />
                )}
                {q.type === "magnitude" && (
                  <MagnitudeInput
                    options={q.options ?? []}
                    value={(answers[q.id] as Record<string, string>) ?? {}}
                    onChange={(v) => set(q.id, v)}
                  />
                )}
                {q.type === "text" && (
                  <textarea
                    className="stub-textarea"
                    rows={3}
                    value={(answers[q.id] as string) ?? ""}
                    onChange={(e) => set(q.id, e.target.value)}
                    placeholder="Optional"
                  />
                )}
              </div>

              {bad && (
                <div className="survey-error">Please answer this question.</div>
              )}
            </div>
          );
        })}
      </div>

      {showErrors && missing.length > 0 && (
        <div className="survey-error survey-error-summary">
          {missing.length} question{missing.length === 1 ? "" : "s"} still need
          {missing.length === 1 ? "s" : ""} an answer.
        </div>
      )}

      <div className="nav-row">
        <span />
        <button className="btn btn-primary" onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </section>
  );
}

// ── 1 to 5 scale ─────────────────────────────────────────────

function LikertInput({
  value,
  labels,
  scale,
  onChange,
}: {
  value: number | undefined;
  labels: [string, string];
  scale?: number[];
  onChange: (n: number) => void;
}) {
  const points = scale ?? [1, 2, 3, 4, 5];
  return (
    <div className="likert">
      <span className="likert-end">{labels[0]}</span>
      <div className="likert-scale">
        {points.map((n) => (
          <button
            key={n}
            className={"likert-btn" + (value === n ? " on" : "")}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${n}`}
          >
            {n > 0 && points.some((p) => p < 0) ? `+${n}` : n}
          </button>
        ))}
      </div>
      <span className="likert-end">{labels[1]}</span>
    </div>
  );
}

// ── pick one ─────────────────────────────────────────────────

function SingleInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="single-list">
      {options.map((o) => (
        <button
          key={o}
          className={"single-opt" + (value === o ? " on" : "")}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ── ranking: assign 1..n, each used once ─────────────────────

function RankInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  function pick(option: string, rank: number) {
    const next: Record<string, number> = { ...value };
    // clear this rank from whoever else had it (ranks are unique)
    for (const k of Object.keys(next)) {
      if (next[k] === rank) delete next[k];
    }
    if (next[option] === rank) {
      delete next[option]; // tapping again clears it
    } else {
      next[option] = rank;
    }
    onChange(next);
  }

  return (
    <div className="rank-grid">
      {options.map((o) => (
        <div key={o} className="rank-row">
          <span className="rank-label">{o}</span>
          <div className="rank-btns">
            {options.map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  className={"rank-btn" + (value[o] === n ? " on" : "")}
                  onClick={() => pick(o, n)}
                  aria-pressed={value[o] === n}
                  aria-label={`Rank ${o} as ${n}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── magnitude: multiplier vs. the user's own #1 ──────────────

function MagnitudeInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  return (
    <div className="mag-grid">
      {options.map((o) => (
        <div key={o} className="mag-row">
          <label className="mag-label" htmlFor={`mag-${o}`}>
            {o}
          </label>
          <div className="mag-input-wrap">
            <input
              id={`mag-${o}`}
              type="number"
              inputMode="decimal"
              step="0.05"
              min="0"
              className="mag-input"
              placeholder="1.0"
              value={value[o] ?? ""}
              onChange={(e) => onChange({ ...value, [o]: e.target.value })}
            />
            <span className="mag-suffix">x</span>
          </div>
        </div>
      ))}
      <p className="mag-note">
        Leave your #1 blank or enter 1. Enter a number for each of the others.
      </p>
    </div>
  );
}
