"use client";

// Control condition. Same content and surveys as the treatment version, but
// one fixed journey in a forced order with no entry-point choice or branching.
// Sessions are tagged source: "control" in the exported data.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPage,
  controlSequence,
  controlTitle,
  CALC,
} from "@/data/pages";
import Calculator from "@/components/Calculator";
import Survey, { SurveyAnswers } from "@/components/Survey";
import { preQuestions, postQuestions } from "@/data/survey-questions";
import { richSegments, definitionFor } from "@/data/glossary";
import {
  createSession,
  logSource,
  logModuleEnter,
  logSurvey,
  SessionLog,
} from "@/lib/instrumentation";

type View =
  | { name: "intro" }
  | { name: "pre-survey" }
  | { name: "step"; index: number }
  | { name: "post-survey" }
  | { name: "done" };

export default function ControlVersion() {
  const sessionRef = useRef<SessionLog>();
  if (!sessionRef.current) sessionRef.current = createSession();
  const session = sessionRef.current;

  const [view, setView] = useState<View>({ name: "intro" });
  const [calcDone, setCalcDone] = useState(false);
  const [furthest, setFurthest] = useState(0);

  useEffect(() => {
    logSource(session, "control");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToStep(index: number) {
    const step = controlSequence[index];
    logModuleEnter(session, step === CALC ? "CALC" : step);
    setFurthest((f) => Math.max(f, index));
    setView({ name: "step", index });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div>
            <div className="brand-name">Heat Pump Decision Support</div>
            <div className="brand-sub">Plain answers, one step at a time</div>
          </div>
        </div>
      </header>

      <div className={view.name === "step" ? "layout" : undefined}>
        <div>
          {view.name === "intro" && (
            <section>
              <h1 className="hero-title">Thanks for helping with our research</h1>
              <p className="hero-lede">
                Three quick parts: a few questions about what you think now, then
                a walkthrough of heat pump basics, then a short set of questions
                at the end.
              </p>
              <div className="nav-row">
                <span />
                <button
                  className="btn btn-primary"
                  onClick={() => setView({ name: "pre-survey" })}
                >
                  Start
                </button>
              </div>
            </section>
          )}

          {view.name === "pre-survey" && (
            <Survey
              title="Before you start"
              intro="A few quick questions about what you think today. There are no right or wrong answers, and we ask them again at the end to see what changed."
              questions={preQuestions}
              submitLabel="Begin"
              onComplete={(a: SurveyAnswers) => {
                logSurvey(session, "pre", a);
                goToStep(0);
              }}
            />
          )}

          {view.name === "step" && (
            <ControlStep
              index={view.index}
              calcDone={calcDone}
              onCalcDone={() => setCalcDone(true)}
              onNext={() =>
                view.index + 1 < controlSequence.length
                  ? goToStep(view.index + 1)
                  : setView({ name: "post-survey" })
              }
              onBack={() => view.index > 0 && goToStep(view.index - 1)}
            />
          )}

          {view.name === "post-survey" && (
            <Survey
              title="Last few questions"
              intro="The same questions as the beginning, plus a couple about the tool itself."
              questions={postQuestions}
              submitLabel="Finish"
              onComplete={(a: SurveyAnswers) => {
                logSurvey(session, "post", a);
                setView({ name: "done" });
              }}
            />
          )}

          {view.name === "done" && (
            <section className="clarity-card">
              <h2 className="clarity-title">All done, thank you</h2>
              <p className="clarity-sub">
                Your responses have been recorded. Please let the facilitator
                know you have finished.
              </p>
            </section>
          )}
        </div>

        {view.name === "step" && (
          <ControlRail
            current={view.index}
            furthest={furthest}
            onJump={goToStep}
          />
        )}
      </div>

      <footer className="footer-note">
        Prototype. No personal information is collected.
      </footer>
    </main>
  );
}

// ── One step of the fixed sequence ──────────────────────────

function ControlStep({
  index,
  calcDone,
  onCalcDone,
  onNext,
  onBack,
}: {
  index: number;
  calcDone: boolean;
  onCalcDone: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const step = controlSequence[index];
  const isLast = index === controlSequence.length - 1;

  if (step === CALC) {
    return (
      <section>
        <div className="page-meta-row">
          <div className="thread-hint">
            Step {index + 1} of {controlSequence.length}
          </div>
        </div>
        <Calculator onDone={onNext} onInputsChange={() => onCalcDone()} />
        <div className="nav-row">
          <button className="btn btn-ghost" onClick={onBack}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={onNext}
            disabled={!calcDone}
            title={calcDone ? undefined : "Complete the calculator to continue"}
          >
            Next
          </button>
        </div>
      </section>
    );
  }

  const page = getPage(step);
  if (!page) return null;

  return (
    <section>
      <div className="page-meta-row">
        <div className="thread-hint">
          Step {index + 1} of {controlSequence.length}
        </div>
      </div>

      <article className="module-card">
        <h2 className="module-title">{page.title}</h2>
        <div className="module-body">
          <ControlBody body={page.body} />
        </div>
      </article>

      <div className="nav-row">
        <button
          className="btn btn-ghost"
          onClick={onBack}
          disabled={index === 0}
        >
          Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}

// ── Progress rail (visible, but not clickable ahead) ────────

function ControlRail({
  current,
  furthest,
  onJump,
}: {
  current: number;
  furthest: number;
  onJump: (i: number) => void;
}) {
  return (
    <aside className="journey-rail" aria-label="Your progress">
      <div className="journey-heading">Your progress</div>
      {controlSequence.map((step, i) => {
        const reached = i <= furthest;
        return (
          <button
            key={step}
            className={"journey-step" + (i === current ? " here" : "")}
            onClick={() => reached && onJump(i)}
            disabled={!reached}
            aria-current={i === current ? "step" : undefined}
          >
            <span
              className="journey-dot"
              aria-hidden
              style={
                reached ? { background: "var(--pine)", opacity: 1 } : undefined
              }
            />
            {controlTitle(step)}
            {i === current && <span className="journey-you">you are here</span>}
          </button>
        );
      })}
    </aside>
  );
}

// ── Body rendering (same formatting as the main tool) ───────

function ControlLine({ text }: { text: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const parts = richSegments(text);
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "link") {
          let host = p.value;
          try {
            host = new URL(p.value).hostname.replace(/^www\./, "");
          } catch {}
          return (
            <a
              key={i}
              href={p.value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-link"
            >
              {host}
            </a>
          );
        }
        if (p.type === "text") return <span key={i}>{p.value}</span>;
        const def = definitionFor(p.value);
        if (!def) return <span key={i}>{p.value}</span>;
        return (
          <span key={i} className="term-wrap">
            <button
              className="term"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              {p.value}
            </button>
            {open === i && (
              <span className="term-tip" role="tooltip">
                {def}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}

function ControlBody({ body }: { body: string[] }) {
  const out: JSX.Element[] = [];
  let list: string[] = [];
  let key = 0;

  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={key++} className="body-list">
          {list.map((item, i) => (
            <li key={i}>
              <ControlLine text={item} />
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const line of body) {
    if (line.startsWith("- ")) list.push(line.slice(2));
    else if (line.startsWith("## ")) {
      flush();
      out.push(
        <h3 key={key++} className="body-subhead">
          {line.slice(3)}
        </h3>
      );
    } else {
      flush();
      out.push(
        <p key={key++}>
          <ControlLine text={line} />
        </p>
      );
    }
  }
  flush();
  return <>{out}</>;
}
