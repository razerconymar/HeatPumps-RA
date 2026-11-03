"use client";

// Kept so the survey link already shared with the team still works. Everything
// now starts at the single entry point, which assigns the condition.

import { useEffect } from "react";

export default function SurveyEntry() {
  useEffect(() => {
    window.location.replace("/");
  }, []);

  return (
    <main className="shell">
      <section className="clarity-card">
        <h1 className="clarity-title">Taking you to the start</h1>
        <p className="clarity-sub">
          If nothing happens, <a href="/">open the tool here</a>.
        </p>
      </section>
    </main>
  );
}
