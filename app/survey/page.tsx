"use client";

// ─────────────────────────────────────────────────────────────
// Separate entry point for focus group / research participants,
// distinct from the DST's own landing page (app/page.tsx).
//
// Flow: participant gets a link to /survey (not "/") -> reads a
// short intro -> clicks through to the real Qualtrics survey ->
// Qualtrics' own "End of Survey" redirect setting sends them to
// this site's root URL with ?ref=qualtrics-focus-group appended
// -> the main app (app/page.tsx) detects that param, tags the
// anonymous session with its source, and shows a short "welcome
// back" line before the normal DST landing page.
//
// SETUP NEEDED IN QUALTRICS (one-time, on your end):
//   Survey Flow -> End of Survey element -> "Redirect to a URL"
//   -> paste: https://YOUR-VERCEL-URL.vercel.app/?ref=qualtrics-focus-group
//   Replace QUALTRICS_SURVEY_URL below with your real survey link.
// ─────────────────────────────────────────────────────────────

const QUALTRICS_SURVEY_URL = "https://your-org.qualtrics.com/jfe/form/REPLACE_ME";

export default function SurveyEntry() {
  return (
    <main className="shell">
      <header className="brand">
        <div className="brand-mark" aria-hidden />
        <div>
          <div className="brand-name">Heat Pump Decision Support</div>
          <div className="brand-sub">Research participant entry</div>
        </div>
      </header>

      <section className="clarity-card" style={{ textAlign: "left" }}>
        <h1 className="hero-title" style={{ marginBottom: 14 }}>
          Thanks for helping with our research
        </h1>
        <p className="hero-lede" style={{ marginBottom: 24 }}>
          You&rsquo;re here because you&rsquo;re part of our focus group. Before
          you explore the tool, we have a short survey, about 5 minutes.
          Afterward, you&rsquo;ll be brought straight into the tool itself.
        </p>

        <div className="persona-grid">
          <a
            className="persona-card"
            href={QUALTRICS_SURVEY_URL}
            style={{ display: "block", textDecoration: "none" }}
          >
            <div className="persona-label">Start the survey</div>
            <div className="persona-desc">
              About 5 minutes. You&rsquo;ll come right back here when you&rsquo;re
              done.
            </div>
          </a>

          <a
            className="persona-card"
            href="/"
            style={{ display: "block", textDecoration: "none" }}
          >
            <div className="persona-label">
              Just explore the tool, skip the survey
            </div>
            <div className="persona-desc">
              For anyone not part of the research study.
            </div>
          </a>
        </div>

        <p className="footer-note" style={{ marginTop: 32, textAlign: "left" }}>
          Your survey responses go to our research team through Qualtrics
          directly. Your activity inside the tool afterward is tracked only
          anonymously, no name or personal information, as explained on the
          &ldquo;Where does this data go?&rdquo; page once you&rsquo;re inside.
        </p>
      </section>
    </main>
  );
}
