"use client";

import { useRef, useState } from "react";
import {
  getPage,
  landingLinks,
  exploreLinks,
  persistentNav,
  threadInfo,
  searchPages,
  PageLink,
  CALC,
  LANDING,
  EXPLORE,
} from "@/data/pages";
import Calculator from "@/components/Calculator";
import {
  createSession,
  logPersona,
  logModuleEnter,
  logClarity,
  exportSessions,
  SessionLog,
} from "@/lib/instrumentation";

type View =
  | { name: "landing" }
  | { name: "explore" }
  | { name: "page"; code: string }
  | { name: "calc" }
  | { name: "data-info" }
  | { name: "clarity" }
  | { name: "done" };

export default function Home() {
  const sessionRef = useRef<SessionLog>();
  if (!sessionRef.current) sessionRef.current = createSession();
  const session = sessionRef.current;

  const [view, setView] = useState<View>({ name: "landing" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [trail, setTrail] = useState<{ code: string; title: string }[]>([]);

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
    setView({ name: "clarity" });
  }

  function answerClarity(a: "yes" | "somewhat" | "no") {
    logClarity(session, a);
    setView({ name: "done" });
  }

  function reset() {
    sessionRef.current = createSession();
    setMenuOpen(false);
    setTrail([]);
    setView({ name: "landing" });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand" onClick={reset} role="button" tabIndex={0}>
          <div className="brand-mark" aria-hidden />
          <div>
            <div className="brand-name">Heat Pump Decision Support</div>
            <div className="brand-sub">Plain answers, one step at a time</div>
          </div>
        </div>
        <button
          className="menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      {menuOpen && (
        <nav className="menu-panel" aria-label="Site navigation">
          <div className="menu-section menu-search">
            <input
              type="search"
              className="search-input"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search topics"
            />
            {search.trim().length >= 2 && (
              <div className="search-results">
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
          {persistentNav.map((section) => (
            <div key={section.heading} className="menu-section">
              <div className="menu-heading">{section.heading}</div>
              {section.links.map((l) => (
                <button
                  key={l.label}
                  className="menu-link"
                  onClick={() => navigate(l.target)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          ))}
          <div className="menu-section">
            <div className="menu-heading">Information</div>
            <button className="menu-link" onClick={finish}>
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
            <PageView code={view.code} onNavigate={navigate} />
          )}

          {view.name === "calc" && (
            <Calculator onDone={() => navigate(EXPLORE)} />
          )}

          {view.name === "data-info" && <DataInfo />}

          {view.name === "clarity" && <ClarityCheck onAnswer={answerClarity} />}

          {view.name === "done" && <Done onRestart={reset} />}
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
        <button onClick={exportSessions}>Export anonymous session data</button>
      </footer>
    </main>
  );
}

// ── Landing page (0A) ───────────────────────────────────────

function Landing({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <section>
      <h1 className="hero-title">What brings you here today?</h1>
      <p className="hero-lede">
        Heat pumps are unfamiliar to most people, and the information online is
        overwhelming. Pick the question that sounds most like you, and
        we&rsquo;ll take it one step at a time.
      </p>
      <div className="persona-grid">
        {landingLinks.map((l) => (
          <button
            key={l.target}
            className="persona-card"
            onClick={() => onNavigate(l.target)}
          >
            <div className="persona-label">{l.label}</div>
          </button>
        ))}
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
        {exploreLinks.map((l) => (
          <button
            key={l.label}
            className="persona-card"
            onClick={() => onNavigate(l.target)}
          >
            <div className="persona-label">{l.label}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Page renderer ───────────────────────────────────────────

function PageView({
  code,
  onNavigate,
}: {
  code: string;
  onNavigate: (t: string) => void;
}) {
  const page = getPage(code);
  if (!page) return null;
  const thread = threadInfo(code);

  return (
    <section>
      {thread && (
        <div className="thread-hint">
          {thread.name} &middot; page {thread.pos} of {thread.total}
        </div>
      )}
      <article className="module-card printable">
        <h2 className="module-title">{page.title}</h2>
        <div className="module-body">
          {renderBody(page.body)}
        </div>
        {page.status === "stub" && (
          <div className="source-tag">
            <span className="source-pill placeholder">In development</span>
            <span>This page&rsquo;s full content is being drafted.</span>
          </div>
        )}
        {code === "3C" && (
          <div className="print-row">
            <button className="btn btn-ghost" onClick={() => window.print()}>
              Print this guide to bring to contractor visits
            </button>
          </div>
        )}
      </article>

      <div className="related-block">
        <div className="related-label">What would you like to learn next?</div>
        <div className="next-links">
          {page.links.map((l: PageLink) => (
            <button
              key={l.label}
              className="next-link"
              onClick={() => onNavigate(l.target)}
            >
              {l.label}
              <span className="next-arrow" aria-hidden>
                &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderBody(body: string[]) {
  const out: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      out.push(
        <ul key={key++} className="body-list">
          {listBuffer.map((item, i) => (
            <li key={i}>{item}</li>
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
      out.push(<p key={key++}>{line}</p>);
    }
  }
  flushList();
  return out;
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

function Done({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="clarity-card">
      <h2 className="clarity-title">Thanks for exploring</h2>
      <p className="clarity-sub">
        Your feedback helps this tool get better. When you&rsquo;re ready for
        the next step, the contractor questions guide is a good place to
        return to.
      </p>
      <div className="clarity-options">
        <button className="btn btn-primary" onClick={onRestart}>
          Start over
        </button>
      </div>
    </section>
  );
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
        Start
      </button>
      {trail.map((s) => (
        <button
          key={s.code}
          className={"journey-step" + (s.code === current ? " here" : "")}
          onClick={() => onJump(s.code)}
          aria-current={s.code === current ? "step" : undefined}
        >
          <span className="journey-dot" aria-hidden />
          {s.title}
          {s.code === current && <span className="journey-you">you are here</span>}
        </button>
      ))}
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
