"use client";

// The printable version of "What should I ask a contractor?".
//
// Printing the page itself produced the explanations too, which is the wrong
// artefact: during a visit you want the questions and somewhere to write the
// answer, not the reasoning you already read at home. This is hidden on
// screen and is the only thing that prints.

const QUESTIONS: { q: string; note: string }[] = [
  {
    q: "How often do you install heat pumps, and have you worked on homes like mine?",
    note: "Some contractors still judge heat pumps by pre-2010 models.",
  },
  {
    q: "Will you perform a Manual J load calculation?",
    note: "Sizing based on the house, not a rule of thumb. Ask about a blower door test and a Manual S calculation too.",
  },
  {
    q: "Which type of heat pump do you recommend, and why?",
    note: "The reason should mention my home and climate, not just what you usually install.",
  },
  {
    q: "Will I need an electrical panel upgrade?",
    note: "Electrical work changes the total cost, so find out before comparing quotes.",
  },
  {
    q: "Why this size, this model, and this backup heat?",
    note: "Looking for reasoning that connects back to my house.",
  },
  {
    q: "What is the total cost, and what does it include?",
    note: "Equipment, labour, electrical, permits, removal of the old system.",
  },
  {
    q: "Which rebates or tax credits apply, and who files them?",
    note: "Some are claimed by the installer, some by me.",
  },
  {
    q: "What is covered by warranty, and for how long?",
    note: "Equipment and labour are often covered for different lengths of time.",
  },
];

export default function ContractorChecklist() {
  return (
    <div className="print-checklist" aria-hidden>
      <h1>Questions to ask a contractor</h1>
      <p className="print-checklist-intro">
        Worth getting two or three estimates. Where contractors disagree, the
        reasoning behind each answer tells you as much as the price does.
      </p>

      <div className="print-checklist-meta">
        <span>Contractor:</span>
        <span>Date:</span>
      </div>

      <ol className="print-checklist-list">
        {QUESTIONS.map((item) => (
          <li key={item.q}>
            <div className="print-q">{item.q}</div>
            <div className="print-note">{item.note}</div>
            <div className="print-answer-lines">
              <span />
              <span />
            </div>
          </li>
        ))}
      </ol>

      <p className="print-checklist-foot">
        Heat Pump Decision Support. Figures in this tool are estimates and not
        a substitute for a contractor quote.
      </p>
    </div>
  );
}
