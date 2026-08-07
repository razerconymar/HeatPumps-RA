"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPage,
  landingLinks,
  exploreLinks,
  persistentNav,
  threadInfo,
  threadColor,
  threadSurveys,
  searchPages,
  readingTime,
  PageLink,
  CALC,
  LANDING,
  EXPLORE,
} from "@/data/pages";
import Calculator from "@/components/Calculator";
import Survey, { SurveyAnswers } from "@/components/Survey";
import Conclusion from "@/components/Conclusion";
import { AgentContext } from "@/components/AgentPanel";
import { preQuestions, postQuestions } from "@/data/survey-questions";
import HeatPumpDiagram from "@/components/HeatPumpDiagram";
import { seededShuffle } from "@/lib/shuffle";
import {
  DollarSign,
  Wrench,
  HelpCircle,
  Leaf,
  BookOpen,
  Menu as MenuIcon,
  X as CloseIcon,
  Search as SearchIcon,
  Calculator as CalcIcon,
  MapPin,
  Sparkles,
  ChevronDown,
  Scale,
  Accessibility as AccessibilityIcon,
} from "lucide-react";
import { richSegments, definitionFor } from "@/data/glossary";
import {
  createSession,
  logPersona,
  logModuleEnter,
  logClarity,
  logStubFeedback,
  logMicroSurvey,
  logSource,
  logSurvey,
  exportSessions,
  exportSessionsCsv,
  SessionLog,
} from "@/lib/instrumentation";

type View =
  | { name: "landing" }
  | { name: "explore" }
  | { name: "page"; code: string }
  | { name: "calc" }
  | { name: "pre-survey" }
  | { name: "post-survey" }
  | { name: "data-info" }
  | { name: "clarity" }
  | { name: "done" };

export default function Home() {
  const sessionRef = useRef<SessionLog>();
  if (!sessionRef.current) sessionRef.current = createSession();
  const session = sessionRef.current;

  const [view, setView] = useState<View>({ name: "landing" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [openNav, setOpenNav] = useState<string | null>(null);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [search, setSearch] = useState("");
  const [trail, setTrail] = useState<{ code: string; title: string }[]>([]);
  const [seenSurveys, setSeenSurveys] = useState<Set<string>>(new Set());
  const [fromSurvey, setFromSurvey] = useState(false);
  const [calcInputs, setCalcInputs] = useState<Record<string, unknown> | null>(
    null
  );
  // "off" = casual visitor, no surveys. "pre" | "tool" | "done" = study mode.
  const [studyStage, setStudyStage] = useState<"off" | "pre" | "tool" | "done">(
    "off"
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("study") === "1") {
      logSource(session, "research-session");
      setStudyStage("pre");
      setFromSurvey(true);
      setView({ name: "pre-survey" });
    }
    if (params.toString()) {
      // clean the URL so a refresh doesn't restart the study
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assemble the context handed to the conclusion page and agent.
  function buildAgentContext(): AgentContext {
    const visited = session.path
      .map((p) => p.moduleId)
      .filter((id) => id !== "CALC" && !id.startsWith("priority:"));
    const totalMs = session.path.reduce(
      (acc, p) => acc + ((p.exitedAt ?? p.enteredAt) - p.enteredAt),
      0
    );
    return {
      pagesVisited: visited,
      pageTitles: visited
        .map((id) => getPage(id)?.title)
        .filter((t): t is string => Boolean(t)),
      entryQuestion: session.persona
        ? getPage(session.persona)?.title ?? session.persona
        : "",
      usedCalculator: session.path.some((p) => p.moduleId === "CALC"),
      calculatorInputs: calcInputs,
      timeSpentSeconds: Math.round(totalMs / 1000),
      sessionToken: session.sessionToken,
    };
  }

  function dismissSurvey(threadCode: string) {
    setSeenSurveys((s) => new Set(s).add(threadCode));
  }

  function titleFor(target: string): string {
    if (target === CALC) return "Cost calculator";
    if (target === EXPLORE) return "Explore more";
    return getPage(target)?.title ?? target;
  }

  function pushTrail(target: string) {
    setTrail((t) => {
      const existing = t.findIndex((s) => s.code === target);
      if (existing >= 0) return t.slice(0, existing + 1); // backtrack truncates
      return [...t, { code: target, title: titleFor(target) }];
    });
  }

  function navigate(target: string, fromLanding = false) {
    setMenuOpen(false);
    setOpenNav(null);
    if (target === CALC) {
      logModuleEnter(session, "CALC");
      pushTrail(target);
      setView({ name: "calc" });
    } else if (target === EXPLORE) {
      logModuleEnter(session, "0A2");
      pushTrail(target);
      setView({ name: "explore" });
    } else if (target === LANDING) {
      setTrail([]);
      setView({ name: "landing" });
    } else {
      // first click from the landing page identifies the entry thread
      if (fromLanding && session.persona === null) {
        logPersona(session, target);
      }
      logModuleEnter(session, target);
      pushTrail(target);
      setView({ name: "page", code: target });
    }
  }

  function finish() {
    setMenuOpen(false);
    setOpenNav(null);
    if (studyStage === "tool") {
      setView({ name: "post-survey" });
    } else {
      setView({ name: "clarity" });
    }
  }

  function answerClarity(a: "yes" | "somewhat" | "no") {
    logClarity(session, a);
    setView({ name: "done" });
  }

  function reset() {
    sessionRef.current = createSession();
    setStudyStage("off");
    setMenuOpen(false);
    setTrail([]);
    setView({ name: "landing" });
  }

  return (
    <main
      className={"shell" + (highContrast ? " high-contrast" : "")}
      style={{ "--text-scale": textScale } as React.CSSProperties}
    >
      <header className="topbar">
        <div className="brand" onClick={reset} role="button" tabIndex={0}>
          <div className="brand-mark" aria-hidden />
          <div>
            <div className="brand-name">Heat Pump Decision Support</div>
            <div className="brand-sub">Plain answers, one step at a time</div>
          </div>
        </div>

        <nav className="nav-bar" aria-label="Site navigation">
          {persistentNav.map((section) => (
            <NavDropdown
              key={section.heading}
              heading={section.heading}
              links={section.links}
              onNavigate={navigate}
              open={openNav === section.heading}
              onOpen={() => setOpenNav(section.heading)}
              onClose={() =>
                setOpenNav((cur) => (cur === section.heading ? null : cur))
              }
            />
          ))}
          <button className="nav-item nav-item-plain" onClick={finish}>
            <Sparkles size={14} />
            Feedback
          </button>
        </nav>

        <div className="topbar-search">
          <SearchIcon size={16} className="topbar-search-icon" aria-hidden />
          <input
            type="search"
            className="topbar-search-input"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search topics"
          />
          {search.trim().length >= 2 && (
            <div className="topbar-search-results">
              {searchPages(search).length === 0 && (
                <div className="search-empty">No matches</div>
              )}
              {searchPages(search).slice(0, 6).map((p) => (
                <button
                  key={p.code}
                  className="menu-link"
                  onClick={() => {
                    setSearch("");
                    navigate(p.code);
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="a11y-wrap">
          <button
            className={"a11y-btn" + (a11yOpen ? " active" : "")}
            onClick={() => setA11yOpen((o) => !o)}
            aria-expanded={a11yOpen}
            aria-label="Accessibility settings"
            title="Accessibility settings"
          >
            <AccessibilityIcon size={18} />
          </button>
          {a11yOpen && (
            <A11yPanel
              textScale={textScale}
              onTextScale={setTextScale}
              highContrast={highContrast}
              onHighContrast={setHighContrast}
            />
          )}
        </div>

        <button
          className="menu-btn mobile-only"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <CloseIcon size={16} /> : <MenuIcon size={16} />}
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      {menuOpen && (
        <nav className="menu-panel mobile-only" aria-label="Site navigation (mobile)">
          {persistentNav.map((section) => (
            <div key={section.heading} className="menu-section">
              <div className="menu-heading">{section.heading}</div>
              {section.links.map((l) => (
                <button
                  key={l.label}
                  className="menu-link"
                  onClick={() => navigate(l.target)}
                >
                  <NavIcon target={l.target} />
                  {l.label}
                </button>
              ))}
            </div>
          ))}
          <div className="menu-section">
            <div className="menu-heading">Information</div>
            <button className="menu-link" onClick={finish}>
              <Sparkles size={15} />
              I&rsquo;m done - quick feedback
            </button>
          </div>
        </nav>
      )}

      <div className={trail.length > 0 ? "layout" : undefined}>
        <div>
          {view.name === "landing" && (
            <Landing onNavigate={(t) => navigate(t, true)} />
          )}

          {view.name === "explore" && <Explore onNavigate={navigate} />}

          {view.name === "page" && (
            <PageView
              code={view.code}
              onNavigate={navigate}
              session={session}
              seenSurveys={seenSurveys}
              onSurveyDone={dismissSurvey}
            />
          )}

          {view.name === "calc" && (
            <Calculator
              onDone={() => navigate(EXPLORE)}
              onInputsChange={(i) =>
                setCalcInputs(i as unknown as Record<string, unknown>)
              }
            />
          )}

          {view.name === "pre-survey" && (
            <Survey
              title="Before you start"
              intro="A few quick questions about what you think today. There are no right or wrong answers, and we ask a couple of them again at the end to see what changed."
              questions={preQuestions}
              submitLabel="Start exploring"
              onComplete={(a: SurveyAnswers) => {
                logSurvey(session, "pre", a);
                setStudyStage("tool");
                setView({ name: "landing" });
              }}
            />
          )}

          {view.name === "post-survey" && (
            <Survey
              title="Last few questions"
              intro="Same questions as the beginning, plus a couple about the tool itself. This is the last step."
              questions={postQuestions}
              submitLabel="Finish"
              onComplete={(a: SurveyAnswers) => {
                logSurvey(session, "post", a);
                setStudyStage("done");
                setView({ name: "done" });
              }}
            />
          )}

          {view.name === "data-info" && <DataInfo />}

          {view.name === "clarity" && <ClarityCheck onAnswer={answerClarity} />}

          {view.name === "done" && (
            <Conclusion
              context={buildAgentContext()}
              studyMode={studyStage === "done"}
              onNavigate={navigate}
              onRestart={reset}
            />
          )}
        </div>

        {trail.length > 0 &&
          view.name !== "clarity" &&
          view.name !== "done" && (
            <JourneyRail
              trail={trail}
              current={
                view.name === "page"
                  ? view.code
                  : view.name === "calc"
                  ? CALC
                  : view.name === "explore"
                  ? EXPLORE
                  : ""
              }
              onJump={navigate}
              onHome={reset}
            />
          )}
      </div>

      <footer className="footer-note">
        Prototype - content marked &ldquo;in development&rdquo; is under
        review. No personal information is collected.{" "}
        <button onClick={() => setView({ name: "data-info" })}>
          Where does this data go?
        </button>{" "}
        <button onClick={exportSessionsCsv}>Export results (CSV)</button>{" "}
        <button onClick={exportSessions}>Export raw (JSON)</button>
      </footer>
    </main>
  );
}

// ── Landing page (0A) ───────────────────────────────────────

function Landing({
  onNavigate,
  fromSurvey,
}: {
  onNavigate: (t: string) => void;
  fromSurvey?: boolean;
}) {
  return (
    <section>
      {fromSurvey && (
        <div className="survey-welcome">
          Thanks for finishing the survey. Now let&rsquo;s explore the tool.
        </div>
      )}
      <h1 className="hero-title">What brings you here today?</h1>
      <p className="hero-lede">
        Heat pumps are unfamiliar to most people, and the information online is
        overwhelming. Pick the question that sounds most like you, and
        we&rsquo;ll take it one step at a time.
      </p>
      <div className="persona-grid">
        {landingLinks.map((l) => {
          const c = threadColor(l.target);
          return (
            <button
              key={l.target}
              className="persona-card"
              style={c ? ({ "--accent": c } as React.CSSProperties) : undefined}
              onClick={() => onNavigate(l.target)}
            >
              <div className="persona-label">
                <NavIcon target={l.target} />
                {l.label}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Secondary landing (0A2) - progress, don't restart ───────

function Explore({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <section>
      <h1 className="hero-title">Keep going - what&rsquo;s next?</h1>
      <p className="hero-lede">
        You&rsquo;ve covered some ground. Here&rsquo;s everything else people
        usually want to know.
      </p>
      <div className="persona-grid">
        {exploreLinks.map((l) => {
          const c = threadColor(l.target);
          return (
            <button
              key={l.label}
              className="persona-card"
              style={c ? ({ "--accent": c } as React.CSSProperties) : undefined}
              onClick={() => onNavigate(l.target)}
            >
              <div className="persona-label">
                <NavIcon target={l.target} />
                {l.label}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Page renderer ───────────────────────────────────────────

function PageView({
  code,
  onNavigate,
  session,
  seenSurveys,
  onSurveyDone,
}: {
  code: string;
  onNavigate: (t: string) => void;
  session: SessionLog;
  seenSurveys: Set<string>;
  onSurveyDone: (threadCode: string) => void;
}) {
  const page = getPage(code);
  if (!page) return null;
  const thread = threadInfo(code);
  const threadKey = code[0];
  const isLastInThread = thread ? thread.pos === thread.total : false;
  const surveyQuestion = threadSurveys[threadKey];
  const showSurvey =
    isLastInThread && surveyQuestion && !seenSurveys.has(threadKey);
  const orderedLinks = useMemo(
    () => seededShuffle(page.links, session.sessionToken + code),
    [page, session.sessionToken, code]
  );

  return (
    <section>
      <div className="page-meta-row">
        {thread && (
          <div className="thread-hint" style={{ color: thread.color }}>
            <NavIcon target={code} />
            {thread.name} &middot; page {thread.pos} of {thread.total}
          </div>
        )}
        <div className="reading-time">{readingTime(page)}</div>
      </div>
      <article className="module-card printable">
        <h2 className="module-title">{page.title}</h2>
        <div className="module-body">
          <GlossaryBody body={page.body} />
        </div>
        {code === "2A" && <HeatPumpDiagram />}
        {page.status === "stub" && (
          <StubFeedbackForm pageCode={code} session={session} />
        )}
        {code === "3C" && (
          <div className="print-row">
            <button className="btn btn-ghost" onClick={() => window.print()}>
              Print this guide to bring to contractor visits
            </button>
          </div>
        )}
      </article>

      {showSurvey && (
        <MicroSurvey
          question={surveyQuestion}
          onAnswer={(answer) => {
            logMicroSurvey(session, threadKey, surveyQuestion, answer);
            onSurveyDone(threadKey);
          }}
          onDismiss={() => onSurveyDone(threadKey)}
        />
      )}

      <div className="related-block">
        <div className="related-label">What would you like to learn next?</div>
        <div className="next-links">
          {orderedLinks.map((l: PageLink) => {
            const c = threadColor(l.target);
            return (
              <button
                key={l.label}
                className="next-link"
                style={c ? ({ "--accent": c } as React.CSSProperties) : undefined}
                onClick={() => onNavigate(l.target)}
              >
                <span className="next-link-label">
                  <NavIcon target={l.target} />
                  {l.label}
                </span>
                <span className="next-arrow" aria-hidden>
                  &rarr;
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GlossaryLine({ text }: { text: string }) {
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

function GlossaryBody({ body }: { body: string[] }) {
  const out: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      out.push(
        <ul key={key++} className="body-list">
          {listBuffer.map((item, i) => (
            <li key={i}>
              <GlossaryLine text={item} />
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (const line of body) {
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h3 key={key++} className="body-subhead">
          {line.slice(3)}
        </h3>
      );
    } else {
      flushList();
      out.push(
        <p key={key++}>
          <GlossaryLine text={line} />
        </p>
      );
    }
  }
  flushList();
  return <>{out}</>;
}

// ── Stub page feedback capture ──────────────────────────────

function StubFeedbackForm({
  pageCode,
  session,
}: {
  pageCode: string;
  session: SessionLog;
}) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    if (!text.trim()) return;
    logStubFeedback(session, pageCode, text);
    setSent(true);
  }

  return (
    <div className="source-tag stub-feedback">
      <span className="source-pill placeholder">In development</span>
      <span>This page&rsquo;s full content is being drafted.</span>
      {!sent ? (
        <div className="stub-form">
          <label className="stub-label" htmlFor={`stub-${pageCode}`}>
            What would you want to see here?
          </label>
          <textarea
            id={`stub-${pageCode}`}
            className="stub-textarea"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us what would help..."
          />
          <button className="btn btn-primary btn-small" onClick={submit}>
            Send feedback
          </button>
        </div>
      ) : (
        <div className="stub-thanks">Thanks, that&rsquo;s recorded.</div>
      )}
    </div>
  );
}

// ── Clarity check ───────────────────────────────────────────

function ClarityCheck({
  onAnswer,
}: {
  onAnswer: (a: "yes" | "somewhat" | "no") => void;
}) {
  return (
    <section className="clarity-card">
      <h2 className="clarity-title">One quick question</h2>
      <p className="clarity-sub">
        Do you feel clearer about heat pumps than when you started?
      </p>
      <div className="clarity-options">
        <button className="btn btn-primary" onClick={() => onAnswer("yes")}>
          Yes
        </button>
        <button className="btn btn-ghost" onClick={() => onAnswer("somewhat")}>
          Somewhat
        </button>
        <button className="btn btn-ghost" onClick={() => onAnswer("no")}>
          Not really
        </button>
      </div>
    </section>
  );
}



// ── Menu icon lookup ─────────────────────────────────────────

// ── Accessibility panel ──────────────────────────────────────

function A11yPanel({
  textScale,
  onTextScale,
  highContrast,
  onHighContrast,
}: {
  textScale: number;
  onTextScale: (n: number) => void;
  highContrast: boolean;
  onHighContrast: (b: boolean) => void;
}) {
  const sizes: { label: string; value: number }[] = [
    { label: "A", value: 1 },
    { label: "A", value: 1.15 },
    { label: "A", value: 1.3 },
  ];
  return (
    <div className="a11y-panel" role="dialog" aria-label="Accessibility settings">
      <div className="a11y-row">
        <span className="a11y-label">Text size</span>
        <div className="a11y-sizes">
          {sizes.map((s, i) => (
            <button
              key={i}
              className={"a11y-size-btn" + (textScale === s.value ? " on" : "")}
              style={{ fontSize: 13 + i * 3 }}
              onClick={() => onTextScale(s.value)}
              aria-label={
                i === 0 ? "Default text size" : i === 1 ? "Larger text" : "Largest text"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="a11y-row">
        <div className="a11y-toggle-row">
          <span className="a11y-label" style={{ marginBottom: 0 }}>
            High contrast
          </span>
          <button
            className={"a11y-switch" + (highContrast ? " on" : "")}
            role="switch"
            aria-checked={highContrast}
            onClick={() => onHighContrast(!highContrast)}
          >
            <span className="a11y-switch-knob" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nav dropdown (hover on desktop, click/tap on touch) ─────

function NavDropdown({
  heading,
  links,
  onNavigate,
  open,
  onOpen,
  onClose,
}: {
  heading: string;
  links: { label: string; target: string }[];
  onNavigate: (t: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onOpen();
  }
  function handleLeave() {
    closeTimer.current = setTimeout(onClose, 120);
  }

  return (
    <div
      className="nav-dropdown"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="nav-item"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? onClose() : onOpen())}
      >
        {heading}
        <ChevronDown size={13} className={"nav-chevron" + (open ? " up" : "")} />
      </button>
      {open && (
        <div className="nav-dropdown-panel" role="menu">
          {links.map((l) => (
            <button
              key={l.label}
              className="nav-dropdown-link"
              role="menuitem"
              onClick={() => onNavigate(l.target)}
            >
              <NavIcon target={l.target} />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavIcon({ target }: { target: string }) {
  const size = 15;
  if (target === CALC) return <CalcIcon size={size} />;
  if (target === "FIND_REBATES") return <MapPin size={size} />;
  if (target === "FIND_CONTRACTORS") return <Wrench size={size} />;
  const t = target[0];
  if (t === "1") return <DollarSign size={size} />;
  if (t === "2") return <HelpCircle size={size} />;
  if (t === "3") return <Wrench size={size} />;
  if (t === "4") return <Scale size={size} />;
  if (t === "5") return <Leaf size={size} />;
  if (t === "6") return <BookOpen size={size} />;
  return <HelpCircle size={size} />;
}

// ── Journey tracker ─────────────────────────────────────────

function JourneyRail({
  trail,
  current,
  onJump,
  onHome,
}: {
  trail: { code: string; title: string }[];
  current: string;
  onJump: (t: string) => void;
  onHome: () => void;
}) {
  return (
    <aside className="journey-rail" aria-label="Your journey so far">
      <div className="journey-heading">Your journey</div>
      <button className="journey-step start" onClick={onHome}>
        <span className="journey-dot" aria-hidden />
        <BookOpen size={13} />
        Start
      </button>
      {trail.map((s) => {
        const c = threadColor(s.code);
        return (
          <button
            key={s.code}
            className={"journey-step" + (s.code === current ? " here" : "")}
            onClick={() => onJump(s.code)}
            aria-current={s.code === current ? "step" : undefined}
          >
            <span
              className="journey-dot"
              aria-hidden
              style={c ? { background: c, opacity: 1 } : undefined}
            />
            <NavIcon target={s.code} />
            {s.title}
            {s.code === current && <span className="journey-you">you are here</span>}
          </button>
        );
      })}
    </aside>
  );
}

// ── Data transparency ───────────────────────────────────────

function DataInfo() {
  return (
    <section>
      <article className="module-card">
        <h2 className="module-title">Where does this data go?</h2>
        <div className="module-body">
          <p>
            This tool records a small amount of anonymous information about how
            it is used, so the research team can learn which questions matter
            most to people and where the tool can improve.
          </p>
          <h3 className="body-subhead">What is recorded</h3>
          <ul className="body-list">
            <li>Which entry question you picked</li>
            <li>Which pages you visited, and in what order</li>
            <li>Roughly how long you spent on each page</li>
            <li>Your answer to the final one-tap feedback question</li>
          </ul>
          <h3 className="body-subhead">What is never recorded</h3>
          <ul className="body-list">
            <li>Your name, email, address, or any personal information</li>
            <li>Anything about your device or location</li>
            <li>Anything you type into the calculator</li>
          </ul>
          <h3 className="body-subhead">Where it lives</h3>
          <p>
            Right now, everything stays in your own browser. Nothing is sent to
            a server. Each visit gets a random session token that cannot be
            linked back to you. You can download everything this tool has
            recorded using the export link at the bottom of the page, and you
            can erase it at any time by clearing your browser data for this
            site.
          </p>
          <p>
            If a future version sends this information to the research team, it
            will be the same anonymous signals listed above, and this page will
            say so plainly.
          </p>
        </div>
      </article>
    </section>
  );
}


// ── Micro-survey (embedded, dismissible, once per thread) ──

function MicroSurvey({
  question,
  onAnswer,
  onDismiss,
}: {
  question: string;
  onAnswer: (a: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="micro-survey">
      <button className="micro-survey-close" onClick={onDismiss} aria-label="Dismiss">
        <CloseIcon size={14} />
      </button>
      <div className="micro-survey-q">{question}</div>
      <div className="micro-survey-options">
        <button className="btn btn-primary btn-small" onClick={() => onAnswer("yes")}>
          Yes
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => onAnswer("somewhat")}>
          Somewhat
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => onAnswer("not really")}>
          Not really
        </button>
      </div>
    </div>
  );
}
