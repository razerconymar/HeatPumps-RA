// ─────────────────────────────────────────────────────────────
// SURVEY QUESTIONS
//
// Source: "Individual DST Webpage Content" document, which
// specifies the pre-landing-page survey items and names the
// intended dependent variables for the end-of-survey block:
// intent to adopt, feeling prepared to make an informed
// decision, and trust in the DST information.
//
// Design note from that document: pages viewed is also treated
// as a dependent variable. That is captured automatically by the
// tool's own tracking, so it is not asked as a question here.
//
// ─────────────────────────────────────────────────────────────
// HOW TO ADD OR CHANGE A QUESTION
// ─────────────────────────────────────────────────────────────
//
// Add an entry to preQuestions or postQuestions. Five types are
// available, each rendering its own input automatically:
//
//   "likert"     Numeric scale. Needs scaleLabels: [low, high].
//                Defaults to 1-5. Pass scale: [-2,-1,0,1,2] for
//                an agree/disagree scale.
//   "single"     Pick one. Needs options: [...].
//   "rank"       Assign 1..n, each number usable once.
//   "magnitude"  A number box per option, for multipliers.
//   "text"       Free response.
//
// Every question needs a unique id and a prompt. Optional:
// help (grey text under the prompt), optional: true.
//
// IMPORTANT: to compare a question before vs. after, it must
// appear in BOTH lists with the SAME id. The CSV export then
// places them side by side as pre_<id> and post_<id>.
// ─────────────────────────────────────────────────────────────

export type QuestionType =
  | "rank"
  | "magnitude"
  | "likert"
  | "single"
  | "text";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  help?: string;
  options?: string[];
  scaleLabels?: [string, string];
  scale?: number[];
  optional?: boolean;
}

// Agreement scale used by the "good investment" item.
const AGREE_SCALE = [-2, -1, 0, 1, 2];

// ── PRE-SURVEY ───────────────────────────────────────────────
// Asked before the participant reaches the landing page.

export const preQuestions: Question[] = [
  {
    id: "interest",
    type: "likert",
    prompt:
      "On a scale of 1 to 5, how interested are you in purchasing a heat pump for your home?",
    scaleLabels: ["Not at all interested", "Extremely interested"],
  },
  {
    id: "knowledge",
    type: "likert",
    prompt: "On a scale of 1 to 5, how knowledgeable about heat pumps are you?",
    scaleLabels: ["Not at all knowledgeable", "Extremely knowledgeable"],
  },
  {
    id: "good_investment",
    type: "likert",
    prompt:
      "How much do you agree with the following statement: Heat pumps are a good investment.",
    scale: AGREE_SCALE,
    scaleLabels: ["Strongly disagree", "Strongly agree"],
  },
];

// ── POST-SURVEY ──────────────────────────────────────────────
// Repeats the three pre items so change can be measured, then
// adds the end-of-survey dependent variables named in the
// source document.

export const postQuestions: Question[] = [
  {
    id: "interest",
    type: "likert",
    prompt:
      "Now that you have explored the tool: how interested are you in purchasing a heat pump for your home?",
    scaleLabels: ["Not at all interested", "Extremely interested"],
  },
  {
    id: "knowledge",
    type: "likert",
    prompt: "How knowledgeable about heat pumps do you feel now?",
    scaleLabels: ["Not at all knowledgeable", "Extremely knowledgeable"],
  },
  {
    id: "good_investment",
    type: "likert",
    prompt:
      "How much do you agree with the following statement: Heat pumps are a good investment.",
    scale: AGREE_SCALE,
    scaleLabels: ["Strongly disagree", "Strongly agree"],
  },
  {
    id: "intent_to_adopt",
    type: "likert",
    prompt:
      "How likely are you to consider installing a heat pump in the next few years?",
    scaleLabels: ["Not at all likely", "Extremely likely"],
  },
  {
    id: "prepared",
    type: "likert",
    prompt:
      "How much do you agree: I feel more prepared to make an informed decision about heat pumps.",
    scale: AGREE_SCALE,
    scaleLabels: ["Strongly disagree", "Strongly agree"],
  },
  {
    id: "trust",
    type: "likert",
    prompt:
      "How much do you agree: I trust the information presented in this tool.",
    scale: AGREE_SCALE,
    scaleLabels: ["Strongly disagree", "Strongly agree"],
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
