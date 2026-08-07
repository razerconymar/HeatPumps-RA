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

## Focus group / survey entry point

There are two ways into this app:

- **`/`** — the normal DST landing page, for organic visitors
- **`/survey`** — a separate entry page for focus group participants, with a short intro and a link out to your Qualtrics survey

To connect them: build your survey in Qualtrics, then in **Survey Flow → End of Survey element → Redirect to a URL**, set the redirect to your deployed site's root with a tag appended, e.g. `https://your-site.vercel.app/?ref=qualtrics-focus-group`. When someone lands back on `/` with that `ref` param, the app tags their anonymous session with that source (visible in the exported session data) and shows a short "thanks for finishing the survey" line before the normal landing page.

Update `QUALTRICS_SURVEY_URL` in `app/survey/page.tsx` with your real survey link once it's built.

## Link order randomization

The "What would you like to learn next?" links on every page are shown in a randomized order, seeded per session and page. This means one visitor sees a consistent order throughout their visit (no links jumping around mid-read), but different visitors see different orders — so if the research data later shows one link getting clicked more than others, it reflects genuine interest rather than the fact that it happened to be listed first.

## What's intentionally NOT here (deferred scope)

- Financial calculator
- Community/sharing features
- Installer-specific tooling
- Hosted analytics backend (the instrumentation payload is ready to POST to an endpoint when that phase begins)
