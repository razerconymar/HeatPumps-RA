"use client";

// The screen every visitor sees first.
//
// Deliberately framed as the product rather than as a study. People trying
// this out are using the real tool, and the questions around it are there to
// improve it, so nothing here calls it research, a session or an experiment.

export default function Welcome({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <main className="shell">
      <header className="brand">
        <div className="brand-mark" aria-hidden />
        <div>
          <div className="brand-name">Heat Pump Decision Support</div>
        </div>
      </header>

      <section className="clarity-card" style={{ textAlign: "left" }}>
        <h1 className="hero-title" style={{ marginBottom: 14 }}>
          Work out whether a heat pump makes sense for your home
        </h1>
        <p className="hero-lede" style={{ marginBottom: 20 }}>
          Heat pumps are unfamiliar to most people and the information online
          is overwhelming. This walks you through it in plain language, with a
          calculator that uses real numbers for your county.
        </p>

        <div className="study-steps">
          <div className="study-step">
            <span className="study-step-num">1</span>
            <div>
              <div className="study-step-title">Three quick questions</div>
              <div className="study-step-desc">
                There are no right or wrong answers. We only want to know what
                you think before you start.
              </div>
            </div>
          </div>
          <div className="study-step">
            <span className="study-step-num">2</span>
            <div>
              <div className="study-step-title">Use the tool</div>
              <div className="study-step-desc">
                Follow whatever interests you, and take as long as you like.
              </div>
            </div>
          </div>
          <div className="study-step">
            <span className="study-step-num">3</span>
            <div>
              <div className="study-step-title">Tell us how it went</div>
              <div className="study-step-desc">
                Your answers shape what we fix next.
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button className="btn btn-primary" onClick={onStart}>
            Get started
          </button>
        </div>

        <p className="footer-note" style={{ marginTop: 28, textAlign: "left" }}>
          Your answers are anonymous. We never record your name or any
          personal information.
        </p>
      </section>
    </main>
  );
}
