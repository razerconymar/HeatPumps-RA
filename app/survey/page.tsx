"use client";

// ─────────────────────────────────────────────────────────────
// Research participant entry point.
//
// Study design: pre-survey -> free exploration -> post-survey.
// Everything runs inside this app, so pre answers, navigation
// activity, and post answers all land in one record per person
// and export together. No external survey tool required.
//
// Send participants to  /survey  rather than  /  so they get the
// study flow. Casual visitors landing on  /  never see surveys.
// ─────────────────────────────────────────────────────────────

export default function SurveyEntry() {
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
          Three quick parts: a few questions about what you think now, then time
          to explore the tool however you like, then a short set of questions
          at the end.
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
              <div className="study-step-title">Explore the tool</div>
              <div className="study-step-desc">
                Take as long as you like. Follow whatever interests you.
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
          <a
            className="persona-card"
            href="/?study=1"
            style={{ display: "block", textDecoration: "none" }}
          >
            <div className="persona-label">Start</div>
            <div className="persona-desc">
              Begin with the first set of questions.
            </div>
          </a>

          <a
            className="persona-card"
            href="/"
            style={{ display: "block", textDecoration: "none" }}
          >
            <div className="persona-label">Just explore, skip the questions</div>
            <div className="persona-desc">
              For anyone not part of the research session.
            </div>
          </a>
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
