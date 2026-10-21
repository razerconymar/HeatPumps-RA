// Survey questions for the pre/post study.
//
// Source: the "Individual DST Webpage Content" document, which specifies the
// pre-landing-page items and names the end-of-survey dependent variables
// (intent to adopt, feeling prepared to decide, trust in the information).
// Pages viewed is also a dependent variable, captured by the tool's own
// tracking rather than asked as a question.
//
// See DEVELOPER_GUIDE.md for how to add or change a question.

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
