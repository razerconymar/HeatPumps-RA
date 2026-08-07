// ─────────────────────────────────────────────────────────────
// SURVEY QUESTIONS
//
// ⚠ PLACEHOLDER SET. These are working stand-ins adapted from the
// project's Focus Group Handout. Replace them when the finalized
// questions arrive. This is the ONLY file that needs editing — the
// survey screens build themselves from whatever is defined here.
//
// ─────────────────────────────────────────────────────────────
// HOW TO ADD OR CHANGE A QUESTION
// ─────────────────────────────────────────────────────────────
//
// Add an entry to preQuestions or postQuestions. Five types are
// available, and each renders its own input automatically:
//
//   "likert"     1-5 scale. Needs scaleLabels: [lowEnd, highEnd].
//
//   "single"     Pick one. Needs options: [...].
//
//   "rank"       Assign 1..n, each number usable only once.
//                Needs options: [...]. Good for "order these".
//
//   "magnitude"  A number box per option, for multipliers like
//                "1.25x". Needs options: [...].
//
//   "text"       Free response box.
//
// Every question needs a unique  id  and a  prompt.
// Optional extras:  help  (small grey text under the prompt),
//                   optional: true  (skips the required check).
//
// EXAMPLE — adding a new 1-5 question to the pre-survey:
//
//   {
//     id: "own_or_rent",
//     type: "single",
//     prompt: "Do you own or rent your home?",
//     options: ["Own", "Rent", "Other"],
//   },
//
// ─────────────────────────────────────────────────────────────
// IMPORTANT FOR THE BEFORE/AFTER COMPARISON
// ─────────────────────────────────────────────────────────────
//
// Any question you want to compare before vs. after must appear in
// BOTH preQuestions and postQuestions with the SAME id. The CSV
// export then places them side by side as pre_<id> and post_<id>.
// Questions that only make sense once (like "how easy was this
// tool to use") belong in postQuestions only.
//
// Keep the post-survey short. Repeat only what you need to
// compare — long exit surveys are where people give up.
// ─────────────────────────────────────────────────────────────

export type QuestionType =
  | "rank"        // assign 1..n ordering of fixed options
  | "magnitude"   // numeric multiplier vs. a baseline the user picks
  | "likert"      // 1-5 scale
  | "single"      // pick one
  | "text";       // free response

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  help?: string;
  options?: string[];      // for rank / single
  scaleLabels?: [string, string]; // for likert: low end, high end
  optional?: boolean;
}

// The four systems compared throughout the study and the tool.
export const SYSTEMS = [
  "Electric furnace + air conditioner",
  "Heat pump (heating and cooling)",
  "Natural gas furnace + air conditioner",
  "Propane heating + air conditioner",
];

// ── PRE-SURVEY ───────────────────────────────────────────────

export const preQuestions: Question[] = [
  {
    id: "familiarity_costs",
    type: "likert",
    prompt:
      "How familiar are you with what it costs to heat and cool your home each month?",
    scaleLabels: ["Not at all familiar", "Extremely familiar"],
  },
  {
    id: "familiarity_heatpumps",
    type: "likert",
    prompt: "How familiar are you with heat pumps?",
    scaleLabels: ["Not at all familiar", "Extremely familiar"],
  },
  {
    id: "rank_energy",
    type: "rank",
    prompt:
      "Rank these four systems by how much energy they use, for the same 2,000 square foot home.",
    help: "1 = uses the least energy, 4 = uses the most energy.",
    options: SYSTEMS,
  },
  {
    id: "magnitude_energy",
    type: "magnitude",
    prompt: "How much more energy do the others use compared to your #1?",
    help:
      "Your #1 from the last question is the baseline. If you think something uses 25% more energy, enter 1.25. Twice as much, enter 2.",
    options: SYSTEMS,
  },
  {
    id: "rank_cost",
    type: "rank",
    prompt: "Now rank the same four systems by cost to operate.",
    help: "1 = least expensive to run, 4 = most expensive to run.",
    options: SYSTEMS,
  },
  {
    id: "rank_emissions",
    type: "rank",
    prompt: "Rank the same four systems by greenhouse gas emissions.",
    help: "1 = fewest emissions, 4 = most emissions.",
    options: SYSTEMS,
  },
  {
    id: "priority",
    type: "single",
    prompt:
      "If you were considering a heat pump, which would matter most to you?",
    options: [
      "Upfront installation cost",
      "Monthly operating cost",
      "Performance in cold weather",
      "Environmental impact",
      "Indoor air quality and safety",
      "Finding a contractor I trust",
    ],
  },
];

// ── POST-SURVEY ──────────────────────────────────────────────
// Repeats only the comparable knowledge questions, plus a short
// usability block. Kept deliberately brief so people finish it.

export const postQuestions: Question[] = [
  {
    id: "rank_energy",
    type: "rank",
    prompt:
      "Same question as before: rank these four systems by how much energy they use.",
    help: "1 = uses the least energy, 4 = uses the most energy.",
    options: SYSTEMS,
  },
  {
    id: "magnitude_energy",
    type: "magnitude",
    prompt: "How much more energy do the others use compared to your #1?",
    help:
      "Same as before. If you think something uses 25% more energy, enter 1.25.",
    options: SYSTEMS,
  },
  {
    id: "rank_cost",
    type: "rank",
    prompt: "Rank the four systems by cost to operate.",
    help: "1 = least expensive to run, 4 = most expensive to run.",
    options: SYSTEMS,
  },
  {
    id: "rank_emissions",
    type: "rank",
    prompt: "Rank the four systems by greenhouse gas emissions.",
    help: "1 = fewest emissions, 4 = most emissions.",
    options: SYSTEMS,
  },
  {
    id: "confidence_change",
    type: "likert",
    prompt:
      "How confident do you feel making a decision about a heat pump now?",
    scaleLabels: ["Not at all confident", "Extremely confident"],
  },
  {
    id: "ease_of_use",
    type: "likert",
    prompt: "How easy was this tool to navigate?",
    scaleLabels: ["Very difficult", "Very easy"],
  },
  {
    id: "trust",
    type: "likert",
    prompt: "How much did you trust the information in this tool?",
    scaleLabels: ["Not at all", "Completely"],
  },
  {
    id: "missing",
    type: "text",
    prompt: "What were you looking for that you could not find?",
    optional: true,
  },
  {
    id: "confusing",
    type: "text",
    prompt: "Was anything confusing or unclear?",
    optional: true,
  },
];
