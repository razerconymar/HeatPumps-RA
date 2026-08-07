# Heat Pump Decision Support Tool — Prototype

A guided, modular decision-support prototype for homeowners navigating the heat pump decision. Built for the Duke Energy / SCI REMC sponsored project.

## What this implements

- **Persona-based entry** — Curious Homeowner, Urgent Replacement, and open Browse mode
- **Guided modular journey** — ordered content cards with progress indicator and branching via related-topic chips
- **15 content modules** — drawn from the sponsor briefing and heat pump background memo, each tagged with its source and validation status (`data/content.ts`)
- **Research instrumentation** — the six signals from the project spec: persona selected, first module, full navigation path, drop-off point, time per module, and end-of-session clarity (`lib/instrumentation.ts`). Anonymous session tokens, no PII, data stays in the browser in v1 with a JSON export button in the footer.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com → Add New → Project → import the repo
3. Framework preset auto-detects Next.js — no configuration needed
4. Deploy. Every future push to `main` updates production; every pull request gets its own preview URL for sponsor review

## Editing content

All content lives in `data/content.ts`. Each module has:
- `body` — paragraphs of plain-language content
- `source` — where it came from (`sponsor-briefing`, `background-memo`, `placeholder`)
- `status` — `validated` or `placeholder` (renders as a visible tag)
- `related` — module ids offered as branch chips

Add a module to a persona's journey by adding its id to that persona's `flow` array. No other code changes needed.

## Research sessions (built-in survey)

**Study design: pre-survey → free exploration → post-survey.** Everything runs inside this app. No Qualtrics or external survey tool is needed, and no configuration is required.

Two entry points:

- **`/`** — normal landing page. Casual visitors never see surveys.
- **`/survey`** — research session entry. Explains the three parts, then starts the study.

The pre-survey uses the ranking and magnitude questions from the project's focus group handout (energy use, operating cost, and emissions across four heating systems). The post-survey repeats only the comparable knowledge questions, plus short usability items. That before/after pairing is the point: it shows whether the tool measurably changed what people understand, not just whether they liked it.

### Changing the survey questions

The current questions are **placeholders** adapted from the focus group handout. Replace them in `data/survey-questions.ts` — that is the only file to edit, and the survey screens rebuild themselves from whatever is defined there.

Five question types are available (`likert`, `single`, `rank`, `magnitude`, `text`), each of which renders its own input automatically. Full instructions and an example are in the comment block at the top of that file.

One rule matters for the research design: any question you want to compare before vs. after must appear in **both** `preQuestions` and `postQuestions` with the **same `id`**. The CSV export then places them side by side as `pre_<id>` and `post_<id>`.

### Running a session

Open `/survey` on the participant's device and hand it over. Pre answers, every page they visit, time per page, drop-off point, and post answers all record automatically under one anonymous session token.

### Getting the data out

Two buttons in the footer:

- **Export results (CSV)** — one row per participant with pre and post answers side by side, ready for Excel, R, or SPSS with no reshaping
- **Export raw (JSON)** — full detail including exact navigation sequence and timestamps

Data is stored in the browser's localStorage, so **export before clearing browser data or switching devices.** For in-person sessions on a device you control this is fine; for remote data collection you would need to add a backend endpoint.

### Privacy

No names, emails, or personal information are collected. Each session gets a random token that exists only to link a participant's pre answers, activity, and post answers together.


## Conclusion page and agent integration

The visit ends on a conclusion page (`components/Conclusion.tsx`) that recaps which pages the person read, notes whether they used the calculator, and offers concrete next steps (rebates, contractor questions, finding an installer).

**The conversational agent plugs into `components/AgentPanel.tsx` and nothing else.** That file currently renders a labelled placeholder. Replace the marked section with the real agent UI; no other file needs to change.

The agent receives an `AgentContext` object describing the visit:

| Field | What it holds |
|---|---|
| `pagesVisited` | page codes in visit order, e.g. `["1A","1B","1E"]` |
| `pageTitles` | the same list, human-readable |
| `entryQuestion` | the question they picked on the landing page |
| `usedCalculator` | whether they opened the cost calculator |
| `calculatorInputs` | their last calculator settings, or `null` |
| `timeSpentSeconds` | total time in the tool |
| `sessionToken` | anonymous id, not tied to any identity |

That context exists so the agent can open with something specific rather than a blank prompt — someone who spent their visit in the money thread and ran the calculator should get a different opening than someone who only read the basics.

Three things worth passing along to whoever builds it:

- **No personal information is available here, by design.** Please keep it that way.
- **Use the existing CSS variables** (`--ink`, `--card`, `--pine`, etc.) and wrap font sizes in `calc(Npx * var(--text-scale, 1))`. The agent then inherits the text-size control and high-contrast mode automatically.
- **Ground it in the real page content** exported from `data/pages.ts`. The rest of the tool cites actual sources and flags anything unvalidated; an agent inventing rebate amounts would undercut that.

## Link order randomization

The "What would you like to learn next?" links on every page are shown in a randomized order, seeded per session and page. This means one visitor sees a consistent order throughout their visit (no links jumping around mid-read), but different visitors see different orders — so if the research data later shows one link getting clicked more than others, it reflects genuine interest rather than the fact that it happened to be listed first.

## What's intentionally NOT here (deferred scope)

- Financial calculator
- Community/sharing features
- Installer-specific tooling
- Hosted analytics backend (the instrumentation payload is ready to POST to an endpoint when that phase begins)
