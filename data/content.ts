// ─────────────────────────────────────────────────────────────
// Heat Pump DST — Content Architecture
// Every module is tagged with its source per the traceability
// requirement. Status: "validated" (grounded in sponsor briefing
// or background memo) or "placeholder" (needs review).
// ─────────────────────────────────────────────────────────────

export type ModuleSource = "sponsor-briefing" | "background-memo" | "placeholder";

export interface ContentModule {
  id: string;
  title: string;
  summary: string;
  body: string[];
  source: ModuleSource;
  status: "validated" | "placeholder";
  related: string[]; // ids of modules a user might want next
}

export const modules: ContentModule[] = [
  {
    id: "what-is-a-heat-pump",
    title: "What is a heat pump?",
    summary: "The basics, in plain language.",
    body: [
      "A heat pump is a single system that both heats and cools your home. Instead of creating heat by burning fuel, it moves heat — pulling it from the outdoor air into your home in winter, and pushing it out in summer.",
      "Because moving heat takes less energy than generating it, heat pumps can deliver two to four units of heat for every unit of electricity they use. That efficiency is the core reason they've become the leading option for home electrification.",
      "If you have a refrigerator, you already own a heat pump. It works on the same principle, just in one direction.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["vs-legacy-hvac", "cold-climate", "myths"],
  },
  {
    id: "vs-legacy-hvac",
    title: "How is it different from a furnace or AC?",
    summary: "One system replaces two.",
    body: [
      "A traditional setup uses two separate systems: a furnace (gas, propane, or electric resistance) for heat, and a central air conditioner for cooling. A heat pump replaces both with one unit.",
      "The outdoor unit looks almost identical to a standard AC condenser. The difference is a reversing valve inside that lets it run in either direction — cooling mode in summer, heating mode in winter.",
      "For homeowners, this means one system to maintain, one system to replace, and typically lower operating costs than electric resistance heat or propane.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["what-is-a-heat-pump", "dual-fuel", "cost-drivers"],
  },
  {
    id: "cold-climate",
    title: "Does it work in cold climates?",
    summary: "Yes — modern units are built for it.",
    body: [
      "This is the most common concern, and the technology has changed dramatically. Modern cold-climate heat pumps maintain full heating capacity down to 5°F and continue operating below -10°F.",
      "Older units from the 1990s and 2000s genuinely struggled in cold weather, which is where the reputation comes from. Cold-climate models use variable-speed compressors and improved refrigerants specifically engineered for low temperatures.",
      "In Indiana's climate zone, a properly sized cold-climate heat pump can serve as the sole heating source for most homes. Some homeowners choose a dual-fuel setup as a backup, which is covered in a separate module.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["dual-fuel", "myths", "sizing"],
  },
  {
    id: "cost-drivers",
    title: "What drives the cost?",
    summary: "Equipment, installation, and your home itself.",
    body: [
      "Installed costs typically range widely because three factors interact: the equipment tier (single-stage vs. variable-speed), the complexity of installation (ductwork condition, electrical panel capacity), and your home's characteristics (size, insulation, existing infrastructure).",
      "A straightforward replacement where ductwork and electrical are adequate sits at the lower end. Homes needing duct modification, panel upgrades, or removal of old equipment move up from there.",
      "The most important cost insight: rebates and tax credits can meaningfully reduce the net price, and weatherization before installation can let you buy a smaller, cheaper unit. Both are covered in their own modules.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["rebates", "weatherization", "operating-costs"],
  },
  {
    id: "rebates",
    title: "Rebates and incentives",
    summary: "Federal, state, and utility programs can stack.",
    body: [
      "Three layers of incentives may apply: the federal tax credit for qualifying heat pumps, state-level programs, and utility rebates from providers like Duke Energy and REMC cooperatives.",
      "These programs frequently change in amount and eligibility, so the specific numbers here are intentionally left as a placeholder until validated against current program terms.",
      "The key takeaway for now: never evaluate a heat pump quote without checking what incentives apply. The net cost after incentives is often significantly lower than the sticker price.",
    ],
    source: "placeholder",
    status: "placeholder",
    related: ["cost-drivers", "contractor-questions"],
  },
  {
    id: "weatherization",
    title: "Why weatherize first?",
    summary: "A tighter home needs a smaller system.",
    body: [
      "Air sealing and insulation reduce how much heating and cooling your home needs. That matters for heat pumps specifically, because a smaller heating load means a smaller — and cheaper — unit can do the job.",
      "The sponsor briefing emphasizes weatherization as a first step in the decision journey, not an afterthought. An oversized heat pump installed in a leaky home costs more upfront and runs less efficiently.",
      "Many utilities offer free or subsidized home energy audits that identify the highest-impact weatherization steps.",
    ],
    source: "sponsor-briefing",
    status: "validated",
    related: ["sizing", "cost-drivers"],
  },
  {
    id: "myths",
    title: "Myths and misperceptions",
    summary: "The common objections, addressed directly.",
    body: [
      "\"Heat pumps don't work in the cold.\" Modern cold-climate units heat effectively well below zero. This was true of older units and is the most persistent outdated belief.",
      "\"The air from the vents feels cold.\" Heat pump supply air is typically 90–100°F — warmer than your body, but cooler than a gas furnace's 120°F+ blast. It heats the home just as effectively; it feels different, not worse.",
      "\"Electricity is more expensive than gas.\" Per unit of energy, sometimes. But because heat pumps are 2–4x more efficient than combustion, the delivered cost of heat is often comparable or lower — especially versus propane or electric resistance.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["cold-climate", "operating-costs"],
  },
  {
    id: "sizing",
    title: "Getting the size right",
    summary: "Bigger is not better.",
    body: [
      "Heat pump sizing should be based on a Manual J load calculation — a room-by-room analysis of your home's actual heating and cooling needs. Rule-of-thumb sizing by square footage alone is a red flag.",
      "An oversized unit cycles on and off rapidly, which reduces efficiency, worsens humidity control, and shortens equipment life. An undersized unit struggles on the coldest days.",
      "When getting quotes, ask each contractor whether they perform a Manual J calculation. Their answer tells you a lot about the quality of the installation you'll get.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["contractor-questions", "weatherization"],
  },
  {
    id: "dual-fuel",
    title: "Dual-fuel systems",
    summary: "Heat pump plus furnace backup.",
    body: [
      "A dual-fuel (hybrid) system pairs a heat pump with a gas furnace. The heat pump handles most of the year; the furnace takes over only during the coldest stretches.",
      "This appeals to homeowners who want the efficiency of a heat pump but aren't ready to fully leave gas, or whose homes have very high heating loads.",
      "The tradeoff: you're maintaining two systems, and you keep a gas connection with its fixed monthly charges. For many homes, a properly sized cold-climate heat pump alone is sufficient — dual-fuel is a choice, not a requirement.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["cold-climate", "cost-drivers"],
  },
  {
    id: "contractor-questions",
    title: "Questions to ask a contractor",
    summary: "How to evaluate quotes with confidence.",
    body: [
      "Ask: Will you perform a Manual J load calculation? Which cold-climate models do you install, and what's their rated capacity at 5°F? What's included in the quote — electrical work, duct modification, old equipment removal?",
      "Ask: Which rebates and tax credits does this equipment qualify for, and will you handle the paperwork? What does the warranty cover, and who services the unit after installation?",
      "A contractor who answers these questions clearly and patiently is demonstrating exactly the competence you're paying for. Vague answers on sizing or incentives are a signal to get another quote.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["sizing", "rebates"],
  },
  {
    id: "urgent-replacement",
    title: "My system just died — what now?",
    summary: "Making a good decision under time pressure.",
    body: [
      "A failed furnace or AC in extreme weather pushes people toward the fastest option, which is usually a like-for-like replacement. But this is exactly the moment when a heat pump is worth a short pause to consider — you're spending thousands either way.",
      "Practical moves: ask contractors to quote both a like-for-like replacement and a heat pump option. Ask about temporary heating or cooling to buy yourself a few days. Portable units and space heaters can bridge the gap safely.",
      "If you must replace immediately with conventional equipment, that's okay — but ask for a heat-pump-ready setup (adequate electrical, compatible air handler) so the next transition is cheaper.",
    ],
    source: "sponsor-briefing",
    status: "validated",
    related: ["contractor-questions", "cost-drivers"],
  },
  {
    id: "operating-costs",
    title: "What will it cost to run?",
    summary: "Monthly bills, compared honestly.",
    body: [
      "Operating cost depends on three variables: your electricity rate, the fuel you're switching from, and your unit's efficiency rating (HSPF2 for heating, SEER2 for cooling).",
      "Switching from propane or electric resistance heat almost always lowers bills. Switching from natural gas is closer — it depends on local gas and electric rates, and results vary by home.",
      "A detailed cost calculator is planned for a later phase of this tool. For now, the honest guidance is: get your last 12 months of utility bills and ask contractors for an estimated annual operating cost comparison as part of their quote.",
    ],
    source: "placeholder",
    status: "placeholder",
    related: ["cost-drivers", "myths"],
  },
  {
    id: "efficiency-ratings",
    title: "Decoding efficiency ratings",
    summary: "SEER2, HSPF2, and what actually matters.",
    body: [
      "SEER2 measures cooling efficiency; HSPF2 measures heating efficiency. Higher numbers mean lower operating costs, but with diminishing returns at the top end.",
      "For cold climates, the number that matters most isn't on the standard label: it's the unit's heating capacity at 5°F, found in the manufacturer's extended performance data. Two units with identical HSPF2 ratings can perform very differently in January.",
      "ENERGY STAR's cold-climate certification is a useful shortcut — it requires units to prove low-temperature performance, not just efficiency in mild conditions.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["cold-climate", "sizing"],
  },
  {
    id: "environmental-impact",
    title: "The environmental case",
    summary: "Emissions today, and as the grid gets cleaner.",
    body: [
      "A heat pump eliminates on-site combustion entirely. Its emissions footprint is whatever your electric grid's footprint is — which means it gets cleaner automatically as the grid adds renewable generation.",
      "Even on today's Midwest grid mix, heat pumps typically produce lower total emissions than gas furnaces because of their efficiency advantage. Against propane or electric resistance heat, the gap is large.",
      "For homeowners motivated by climate impact, the heat pump is generally considered the single highest-impact home upgrade available.",
    ],
    source: "background-memo",
    status: "validated",
    related: ["what-is-a-heat-pump", "myths"],
  },
  {
    id: "installer-perspective",
    title: "For installers: what homeowners ask",
    summary: "Common objections and how this tool frames them.",
    body: [
      "This module is oriented toward installers and contractors using the DST alongside customers. It summarizes the most frequent homeowner concerns: cold-weather performance, upfront cost, and unfamiliarity with the technology.",
      "The tool's content is designed to be shown to customers directly — each module addresses one concern in plain language, so an installer can pull up the relevant card during a conversation.",
      "Installer-specific content (spec sheets, commissioning checklists, rebate paperwork workflows) is planned for a later phase and marked as out of scope for the current prototype.",
    ],
    source: "sponsor-briefing",
    status: "placeholder",
    related: ["myths", "contractor-questions"],
  },
];

// ─────────────────────────────────────────────────────────────
// Personas and guided flows
// Each flow is an ordered card sequence per the Action Points
// doc. Users can follow the sequence or branch via "related".
// ─────────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  label: string;
  description: string;
  entryQuestion: string;
  flow: string[]; // ordered module ids
}

export const personas: Persona[] = [
  {
    id: "curious",
    label: "I'm curious about heat pumps",
    description:
      "You've heard about heat pumps and want to understand whether one makes sense for your home. No urgency — you're learning.",
    entryQuestion: "Start with the basics and build up from there.",
    flow: [
      "what-is-a-heat-pump",
      "vs-legacy-hvac",
      "cold-climate",
      "myths",
      "cost-drivers",
      "rebates",
      "weatherization",
      "environmental-impact",
    ],
  },
  {
    id: "urgent",
    label: "My system is failing or dead",
    description:
      "Your furnace or AC is on its way out — or already gone — and you need to make a good decision quickly.",
    entryQuestion: "Get the essentials for a fast, confident decision.",
    flow: [
      "urgent-replacement",
      "cold-climate",
      "cost-drivers",
      "rebates",
      "contractor-questions",
      "sizing",
    ],
  },
  {
    id: "browse",
    label: "Just let me explore",
    description:
      "You'd rather browse all topics on your own than follow a guided path.",
    entryQuestion: "All modules, organized and open.",
    flow: [], // browse mode shows the full module grid
  },
];

export function getModule(id: string): ContentModule | undefined {
  return modules.find((m) => m.id === id);
}

// ─────────────────────────────────────────────────────────────
// Priority-driven flow personalization
// Options drawn directly from the focus group instrument's
// factor list (upfront cost, incentives, monthly costs, cold
// weather performance, environment, process/contractors).
// The chosen priority moves its modules to the front of the
// segment's flow, and cost priorities insert the calculator.
// ─────────────────────────────────────────────────────────────

export interface Priority {
  id: string;
  label: string;
  modules: string[]; // moved to front of flow
  insertCalculator: boolean;
}

export const priorities: Priority[] = [
  {
    id: "costs",
    label: "Costs and savings",
    modules: ["cost-drivers", "rebates", "operating-costs"],
    insertCalculator: true,
  },
  {
    id: "cold",
    label: "Will it work in the cold?",
    modules: ["cold-climate", "myths", "efficiency-ratings"],
    insertCalculator: false,
  },
  {
    id: "environment",
    label: "Environmental impact",
    modules: ["environmental-impact", "what-is-a-heat-pump"],
    insertCalculator: true,
  },
  {
    id: "process",
    label: "The process and finding a contractor",
    modules: ["contractor-questions", "sizing"],
    insertCalculator: false,
  },
];

export const CALCULATOR_STEP = "__calculator__";

// Build a personalized flow: priority modules first (in priority
// order), then the rest of the persona's flow, deduplicated.
// Calculator inserted after the priority block when relevant.
export function buildFlow(persona: Persona, priority: Priority | null): string[] {
  if (!priority) return [...persona.flow];
  const front = priority.modules.filter(
    (id) => persona.flow.includes(id) || getModule(id) !== undefined
  );
  const rest = persona.flow.filter((id) => !front.includes(id));
  const flow = [...front];
  if (priority.insertCalculator) flow.push(CALCULATOR_STEP);
  flow.push(...rest);
  return flow;
}
