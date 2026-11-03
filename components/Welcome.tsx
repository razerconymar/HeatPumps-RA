"use client";

// The screen every visitor sees first, whichever arm they end up in.
//
// Both conditions open on exactly this screen, so nothing on it hints at
// which arm a participant was assigned to. The wording is deliberately
// neutral about what comes next for the same reason.


export default function Welcome({
  onStart,
  onBrowse,
}: {
  onStart: () => void;
  onBrowse: () => void;
}) {
  return (
    <main className="shell">
      <header className="brand">
        <div className="brand-mark" aria-hidden />
        <div>
          <div className="brand-name">Heat Pump Decision Support</div>
          <div className="brand-sub">Research session</div>
        </div>
      </header>

      <section className="clarity-card" style={{ textAlign: "left" }}>
        <h1 className="hero-title" style={{ marginBottom: 14 }}>
          Thanks for helping with our research
        </h1>
        <p className="hero-lede" style={{ marginBottom: 20 }}>
          Three quick parts: a few questions about what you think now, then
          time with the tool, then a short set of questions at the end.
        </p>

        <div className="study-steps">
          <div className="study-step">
            <span className="study-step-num">1</span>
            <div>
              <div className="study-step-title">A few questions first</div>
              <div className="study-step-desc">
                Just three questions. There are no right or wrong answers, we
                only want to know what you think today.
              </div>
            </div>
          </div>
          <div className="study-step">
            <span className="study-step-num">2</span>
            <div>
              <div className="study-step-title">Use the tool</div>
              <div className="study-step-desc">
                Take as long as you like.
              </div>
            </div>
          </div>
          <div className="study-step">
            <span className="study-step-num">3</span>
            <div>
              <div className="study-step-title">A few questions at the end</div>
              <div className="study-step-desc">
                A few minutes, including the same three questions again.
              </div>
            </div>
          </div>
        </div>

        <div className="persona-grid" style={{ marginTop: 24 }}>
          <button
            className="persona-card"
            onClick={onStart}
            style={{ display: "block", textAlign: "left", width: "100%" }}
          >
            <div className="persona-label">Start</div>
            <div className="persona-desc">
              Begin with the first set of questions.
            </div>
          </button>

          <button
            className="persona-card"
            onClick={onBrowse}
            style={{ display: "block", textAlign: "left", width: "100%" }}
          >
            <div className="persona-label">Just explore, skip the questions</div>
            <div className="persona-desc">
              For anyone not part of the research session.
            </div>
          </button>
        </div>

        <p className="footer-note" style={{ marginTop: 28, textAlign: "left" }}>
          Your answers are recorded without your name or any personal
          information. Each session gets a random code so responses from the
          beginning and end can be compared, and nothing identifies you.
        </p>
      </section>
    </main>
  );
}

