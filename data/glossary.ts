// ─────────────────────────────────────────────────────────────
// Inline glossary: jargon a homeowner will hit in page content
// or when talking to a contractor, defined in plain language.
// ─────────────────────────────────────────────────────────────

export interface GlossaryEntry {
  term: string; 
  definition: string;
}

export const glossary: GlossaryEntry[] = [
  {
    term: "Manual J",
    definition:
      "A standard calculation contractors use to figure out exactly how much heating and cooling your home needs, room by room. Ask for this by name. Skipping it is the most common reason systems get sized wrong.",
  },
  {
    term: "Manual S",
    definition:
      "A follow-up calculation that matches specific equipment models to your home's Manual J numbers. More thorough contractors offer this alongside Manual J.",
  },
  {
    term: "blower door test",
    definition:
      "A diagnostic test where a large fan is temporarily mounted in a doorway to measure how much air leaks out of your home. It helps pinpoint where you're losing heat.",
  },
  {
    term: "dual-fuel",
    definition:
      "A setup that pairs a heat pump with a gas furnace. The heat pump handles most of the year; the furnace kicks in automatically only during the coldest stretches.",
  },
  {
    term: "MMBTU",
    definition:
      "A unit for measuring energy use (one million British Thermal Units). Used here so you can compare different fuels, like electricity and gas, on the same scale.",
  },
  {
    term: "cold-climate heat pump",
    definition:
      "A heat pump model specifically engineered to keep working efficiently well below freezing, down to around -13°F, unlike older or standard models.",
  },
];

const sorted = [...glossary].sort((a, b) => b.term.length - a.term.length);
const pattern = new RegExp(
  "\\b(" + sorted.map((g) => escapeRegExp(g.term)).join("|") + ")\\b",
  "g"
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TextSegment {
  type: "text" | "term";
  value: string;
}

export function splitWithGlossary(text: string): TextSegment[] {
  const parts: TextSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  pattern.lastIndex = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ type: "term", value: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function definitionFor(term: string): string | undefined {
  return glossary.find((g) => g.term === term)?.definition;
}



export interface RichSegment {
  type: "text" | "term" | "link";
  value: string;
}

const urlPattern = /(https?:\/\/[^\s)]+)/g;

export function richSegments(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  urlPattern.lastIndex = 0;
  while ((m = urlPattern.exec(text))) {
    if (m.index > lastIndex) {
      out.push(...splitWithGlossary(text.slice(lastIndex, m.index)).map(toRich));
    }
    out.push({ type: "link", value: m[0] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    out.push(...splitWithGlossary(text.slice(lastIndex)).map(toRich));
  }
  return out.length > 0 ? out : [{ type: "text", value: text }];
}

function toRich(s: TextSegment): RichSegment {
  return { type: s.type, value: s.value };
}
