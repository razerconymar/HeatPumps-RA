# Developer Guide

Orientation for anyone working on this repo. Read this before changing anything.

---

## The shape of it

This is a Next.js app. Two ideas explain most of the structure:

1. **Content is data, not code.** Page text, survey questions, and glossary terms live in plain files under `data/`. You can change wording, add a page, or rewrite a survey without touching any component.
2. **The whole tool is one page.** There is no separate URL per content page. `app/page.tsx` holds a view state and swaps what it renders. That is why the journey tracker and session logging work continuously without anything resetting.

---

## Folder map

```
app/
  page.tsx          The whole tool. Routing, state, layout.
  layout.tsx        HTML shell. Rarely touched.
  globals.css       All styling for the entire app.
  survey/page.tsx   The /survey research entry screen.

components/
  Calculator.tsx    Calculator UI (the inputs and results display)
  Survey.tsx        Renders any survey from a question list
  Conclusion.tsx    End-of-visit page
  AgentPanel.tsx    Slot where the AI agent plugs in
  HeatPumpDiagram.tsx  The winter/summer SVG diagram

data/
  pages.ts          ALL page content, links, thread colors
  survey-questions.ts  Pre and post survey questions
  glossary.ts       Jargon definitions + link detection

lib/
  engine/           The physics engine (county weather, loads, equipment)
  engine-data.ts    Loads the bundled Indiana data file
  calculator.ts     Bridge: engine inputs in, cost/emissions out
  instrumentation.ts  Session tracking and CSV/JSON export
  shuffle.ts        Seeded randomization helper

data/engine/
  indiana-engine-data.json   92 counties, weather stations, HP ratings

tests/
  engine.parity.test.ts      Verifies the engine against the workbook
  reference_cases.json       20 reference recalculations

scripts/
  build-engine-data.mjs      Rebuilds the data file from source
```

---

## What each file actually does

### `data/pages.ts` — the content

The single most important file for content work. Every page is an object:

```ts
"1A": {
  code: "1A",
  title: "Will a heat pump save me money?",
  status: "drafted",          // or "stub" for unfinished
  body: [ "paragraph", "## Subheading", "- bullet" ],
  links: [ { label: "...", target: "1B" } ],
}
```

Body formatting: a line starting with `## ` becomes a subheading, `- ` becomes a bullet, anything else is a paragraph. URLs in the text turn into clickable links automatically.

This file also holds `landingLinks` (home page options), `threads` (the color and page order for each journey), and `persistentNav` (the top menu).

**To change page wording:** edit `body`. **To add a page:** add an entry and point some other page's `links` at it.

### `app/page.tsx` — the engine

Big file, but it is mostly one pattern. A `view` state says what to show:

```ts
type View =
  | { name: "landing" }
  | { name: "page"; code: string }
  | { name: "calc" }
  | { name: "pre-survey" }
  ...
```

`navigate(target)` changes the view, records the visit, and updates the journey trail. Everything else in the file is a component that renders one of those views.

### `lib/calculator.ts` — the math

Pure functions. Takes inputs, returns results. No UI, no side effects. This separation is deliberate and matters for the calculator swap below.

### `lib/instrumentation.ts` — the tracking

Records which pages were visited, in what order, time per page, survey answers, and ratings. Exports to CSV or JSON.

**Known limitation:** data currently lives in the participant's browser (localStorage) and does not transmit anywhere. Fine for in-person sessions where we export at the end. Not sufficient for remote paid participants. A backend endpoint is the pending fix.

### `app/globals.css` — all styling

One file, organized by section with comment headers. Two things worth knowing:

- Colors are CSS variables on `:root`. Change `--pine` and it changes everywhere.
- Every font size is wrapped in `calc(Npx * var(--text-scale, 1))`. That is what makes the accessibility text-size control work. **If you add new CSS, wrap font sizes the same way** or that text will not scale.

---

## The calculator engine

The calculator is three layers. Know which one you are changing.

| Layer | File(s) | What it holds |
|---|---|---|
| **Engine** | `lib/engine/*.ts` | The physics. County weather, bin hours, house heat loss, equipment performance. Ported from Riley's Excel workbook and verified against it. |
| **Bridge** | `lib/calculator.ts` | Translates the site's simple inputs into engine inputs, then layers cost and emissions on top. |
| **UI** | `components/Calculator.tsx`, `components/viz/*` | Inputs, results, charts. |

### The engine

`lib/engine/` is a TypeScript port of `Heat_Pump_Calculator.xlsx`, built by Gaurang and Riley. Steps run in order:

```
house -> weather -> loads -> equipment -> results
```

It covers all 92 Indiana counties with station-matched weather, hourly temperature bins, heat pump capacity derating as it gets colder, and electric backup heat. Pure functions, no I/O: data comes from `data/engine/indiana-engine-data.json` (about 40 KB, bundled with the site).

**It is verified, and must stay that way.** `tests/engine.parity.test.ts` checks the TypeScript against 20 recalculations of the workbook, 45 cells each, plus a full sweep of every county. `npm run build` runs the tests first and refuses to build if any fail. Do not disable that.

```bash
npm test          # just the parity tests
npm run build     # tests, then the production build
```

To rebuild the data file from Riley's processed folder:

```bash
npm run data:engine -- "<path to Riley's data/processed>"
```

### What the engine does NOT do

The engine produces **energy use only**: kWh, therms, gallons, MMBtu. Everything downstream of that is still placeholder:

- Energy prices are single statewide averages ($0.17/kWh, $1.15/therm, $2.63/gal), not utility-specific rates
- Install costs are rough market ranges, not quotes
- Emissions factors are statewide, not eGRID utility-specific
- Rebates are not subtracted at all

Those live in `lib/calculator.ts` under the comment marking the placeholder cost layer. Replacing them with real utility rates is the next piece of work, and the labels in the UI should be updated at the same time so we never show unvalidated numbers as if they were validated.

### Changing engine assumptions

`lib/engine/assumptions.ts` holds the open team decisions (existing furnace AFUE, existing AC SEER2, exterior shading, sizing). Change them for the site in `lib/calculator.ts`:

```ts
export const SITE_ASSUMPTIONS = withOverrides({ sun: { exteriorShading: 0.7 } });
```

Changing an assumption will break the parity tests, because the tests check against the workbook as it stands. That is the point: if we deviate from Riley's numbers it should be a deliberate, visible decision, not a silent drift.

### Changing calculator inputs or display

Inputs are defined as `CalcInputs` in `lib/calculator.ts` and rendered in `components/Calculator.tsx`. Per the 10/16 team decision, **nothing is pre-filled**: results stay hidden until the person has chosen a county, size, insulation, ceiling, weather year, and current system. The "Give me the typical Indiana house" button loads `DEFAULT_CALC_INPUTS` as a starting point.

Charts live in `components/viz/`: `PaybackChart` (15-year cost of ownership with the breakeven point), `PriceThermostatChart` (sensitivity grid), `BalanceChart`, and `AssumptionsPanel`.

## Survey questions

All questions live in `data/survey-questions.ts`. The survey screens build themselves from whatever is defined there, so changing wording or adding a question needs no component changes.

Five question types, each rendering its own input:

| Type | Needs | Renders as |
|---|---|---|
| `likert` | `scaleLabels: [low, high]` | Numeric scale, 1-5 by default. Pass `scale: [-2,-1,0,1,2]` for agree/disagree. |
| `single` | `options: [...]` | Pick one |
| `rank` | `options: [...]` | Assign 1..n, each number usable once |
| `magnitude` | `options: [...]` | A number box per option, for multipliers |
| `text` | — | Free response |

Every question needs a unique `id` and a `prompt`. Optional: `help` (grey text under the prompt) and `optional: true` to skip the required check.

**One rule matters for the research design:** a question you want to compare before vs. after must appear in both `preQuestions` and `postQuestions` with the **same `id`**. The CSV export then places them side by side as `pre_<id>` and `post_<id>`. Questions that only make sense once, like "how easy was this to use", go in `postQuestions` only.


## The conversational agent

`components/AgentPanel.tsx` is the only file the agent needs to be wired into. It currently renders a labelled placeholder; replace that with the real UI.

The panel receives an `AgentContext` describing the visit:

| Field | Holds |
|---|---|
| `pagesVisited` | page codes in visit order, e.g. `["1A","1B","CALC","1E"]` |
| `pageTitles` | the same list, human-readable |
| `entryQuestion` | the question they picked on the landing page |
| `usedCalculator` | whether they ran the calculator |
| `calculatorInputs` | their last calculator settings, or `null` |
| `timeSpentSeconds` | total time in the tool |
| `sessionToken` | anonymous id, not tied to any identity |

That context is there so the agent can open with something specific. Someone who spent their visit on cost and ran the calculator should get a different opening than someone who only read the basics.

Three constraints worth keeping:

- **No personal information reaches this panel, by design.** The session token is random. Don't add name or email collection.
- **Use the existing CSS variables** (`--ink`, `--card`, `--pine`) and wrap font sizes in `calc(Npx * var(--text-scale, 1))`. The agent then inherits the text-size control and high-contrast mode for free.
- **Ground it in the real page content** from `data/pages.ts`. The rest of the tool cites actual sources and flags anything unvalidated; an agent inventing rebate amounts would undercut that.

To log conversations for research, add a logger alongside the existing ones in `lib/instrumentation.ts` so it flows into the same CSV and JSON export.


## Where participant data goes

Answers are stored in a Postgres database and also kept in the browser as a
backup. The database is **transport, not the archive**: export the CSV and keep
the authoritative copy in the secure Teams folder.

### One-time setup

**1. Create the database.** In the Vercel dashboard, open the project, go to
Storage, and add **Neon Postgres** from the Marketplace. Vercel sets
`DATABASE_URL` automatically. The table is created on first write, so there is
no migration step.

**2. Set the export password.** Project Settings → Environment Variables, add
`EXPORT_SECRET` with a long random value. Without it the export route refuses
to run, so a missing variable can never leave the data open.

**3. Redeploy** so both variables are picked up.

### Getting the data out

```
https://YOUR-SITE.vercel.app/api/export?key=YOUR_EXPORT_SECRET
```

Downloads a CSV: one row per participant, one column per answer, plus usage
statistics (pages visited, path taken, drop-off point, time spent, whether the
calculator was used, pre and post completion). Save it to the Teams folder.

### How it behaves

- Sessions transmit as they happen, not only at the end, so someone who
  abandons halfway still leaves a usable partial record.
- Requests are debounced to roughly one per 1.5 seconds.
- A final flush fires on tab close via `sendBeacon`, which survives page unload.
- If the network or database is unavailable, the session keeps running and the
  data stays in local storage. The next event retries.
- With no `DATABASE_URL` set, local development works normally and simply skips
  the server write.

### Privacy

Each participant is a random token with no link to any identity. No names, no
emails, no IP logging. If contact details are ever collected for follow-up they
must live somewhere separate, so identifiable information never sits beside the
responses.


## Running it

```bash
npm install     # first time only
npm run dev     # http://localhost:3000
npm run build   # check it compiles before pushing
```

**Always run `npm run build` before pushing.** It runs the engine parity tests first and refuses to build if any fail. If it fails locally it will fail on Vercel, and the live site keeps serving the previous version until it succeeds.

## Deploying

Push to `main` and Vercel redeploys automatically in a minute or two.

```bash
git add .
git commit -m "what changed"
git push
```

## The four links

| URL | What it is | Who gets it |
|---|---|---|
| `/` | Normal tool, no surveys | General sharing, demos |
| `/survey` | **Treatment condition.** Pre-survey, free exploration, post-survey | Study participants |
| `/control` | **Control condition.** Pre-survey, fixed linear walkthrough, post-survey | Study participants |
| `/api` | (none yet — data storage is still pending) | — |

### Treatment vs. control

Both conditions use the **same content and the same surveys**, so results are directly comparable. The experimental difference is structure only:

| | Treatment (`/survey`) | Control (`/control`) |
|---|---|---|
| Entry | Choose from seven questions | No choice, fixed start |
| Order | Free, branching menus | Forced linear sequence |
| Navigation | "What would you like to learn next" on every page | Next and Back only |
| Progress rail | Yes, jump anywhere visited | Yes, but only back to pages already reached |
| Calculator | Optional, reachable any time | A required step in the sequence |
| Surveys | Identical | Identical |

The control sequence is defined in `data/pages.ts` as `controlSequence`. To change which pages the control group sees, edit that array.

Sessions are tagged in the exported data (`source` column) as `research-session` for treatment and `control` for control, so the two groups can be separated during analysis.

---

## Common tasks

| Task | File |
|---|---|
| Change page wording | `data/pages.ts` |
| Add a content page | `data/pages.ts` |
| Change survey questions | `data/survey-questions.ts` |
| Change journey order or colors | `data/pages.ts` → `threads` |
| Change home page options | `data/pages.ts` → `landingLinks` |
| Add a glossary term | `data/glossary.ts` |
| Change calculator physics | `lib/engine/` (will break parity tests) |
| Change engine assumptions | `lib/engine/assumptions.ts` |
| Change prices / install costs / emissions | `lib/calculator.ts` (placeholder layer) |
| Change calculator inputs/display | `components/Calculator.tsx` |
| Change calculator charts | `components/viz/` |
| Any styling | `app/globals.css` |
| Add the AI agent | `components/AgentPanel.tsx` |
