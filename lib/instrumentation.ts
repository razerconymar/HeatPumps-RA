// ─────────────────────────────────────────────────────────────
// Minimum viable research instrumentation
// ─────────────────────────────────────────────────────────────

export interface ModuleVisit {
  moduleId: string;
  enteredAt: number;
  exitedAt: number | null;
}

export interface StubFeedback {
  pageCode: string;
  text: string;
  submittedAt: number;
}

export interface SurveyResponse {
  phase: "pre" | "post";
  answers: Record<string, unknown>;
  submittedAt: number;
}

export interface MicroSurveyResponse {
  threadCode: string;
  question: string;
  answer: string;
  submittedAt: number;
}

export interface SessionLog {
  sessionToken: string;
  startedAt: number;
  source: string | null; 
  persona: string | null;
  firstModule: string | null;
  path: ModuleVisit[];
  clarity: "yes" | "somewhat" | "no" | null;
  stubFeedback: StubFeedback[];
  microSurveys: MicroSurveyResponse[];
  surveys: SurveyResponse[];
}

const STORAGE_KEY = "hpdst_sessions";

function newToken(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createSession(): SessionLog {
  return {
    sessionToken: newToken(),
    startedAt: Date.now(),
    source: null,
    persona: null,
    firstModule: null,
    path: [],
    clarity: null,
    stubFeedback: [],
    microSurveys: [],
    surveys: [],
  };
}

export function logSurvey(
  session: SessionLog,
  phase: "pre" | "post",
  answers: Record<string, unknown>
): void {
  session.surveys.push({ phase, answers, submittedAt: Date.now() });
  persist(session);
}

export function logMicroSurvey(
  session: SessionLog,
  threadCode: string,
  question: string,
  answer: string
): void {
  session.microSurveys.push({ threadCode, question, answer, submittedAt: Date.now() });
  persist(session);
}

export function logStubFeedback(
  session: SessionLog,
  pageCode: string,
  text: string
): void {
  if (!text.trim()) return;
  session.stubFeedback.push({ pageCode, text: text.trim(), submittedAt: Date.now() });
  persist(session);
}

export function adoptSessionToken(session: SessionLog, token: string): void {
  const clean = token.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  if (!clean) return;
  session.sessionToken = clean;
  persist(session);
}

export function logSource(session: SessionLog, source: string): void {
  if (session.source) return; // first touch wins
  session.source = source;
  persist(session);
}

export function logPersona(session: SessionLog, personaId: string): void {
  session.persona = personaId;
  persist(session);
}

export function logModuleEnter(session: SessionLog, moduleId: string): void {
  // close out the previous visit
  const last = session.path[session.path.length - 1];
  if (last && last.exitedAt === null) {
    last.exitedAt = Date.now();
  }
  if (session.firstModule === null) {
    session.firstModule = moduleId;
  }
  session.path.push({ moduleId, enteredAt: Date.now(), exitedAt: null });
  persist(session);
}

export function logClarity(
  session: SessionLog,
  clarity: "yes" | "somewhat" | "no"
): void {
  const last = session.path[session.path.length - 1];
  if (last && last.exitedAt === null) {
    last.exitedAt = Date.now();
  }
  session.clarity = clarity;
  persist(session);
}

function persist(session: SessionLog): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all: Record<string, SessionLog> = raw ? JSON.parse(raw) : {};
    all[session.sessionToken] = session;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable 
  }
}

// Export all logged sessions as a JSON download (for research use)
export function exportSessions(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "{}";
  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hpdst-sessions.json";
  a.click();
  URL.revokeObjectURL(url);
}


// ─────────────────────────────────────────────────────────────
// CSV export: one row per session, with pre/post answers side by
// side so the before/after comparison is immediately visible in
// Excel or R without any reshaping.
// ─────────────────────────────────────────────────────────────

function flatten(prefix: string, answers: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [qid, val] of Object.entries(answers)) {
    if (val === null || val === undefined) continue;
    if (typeof val === "object") {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        out[`${prefix}_${qid}_${k}`] = String(v);
      }
    } else {
      out[`${prefix}_${qid}`] = String(val);
    }
  }
  return out;
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function exportSessionsCsv(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "{}";
  let all: Record<string, SessionLog>;
  try {
    all = JSON.parse(raw);
  } catch {
    return;
  }

  const rows: Record<string, string>[] = [];
  for (const s of Object.values(all)) {
    const row: Record<string, string> = {
      session_token: s.sessionToken,
      started_at: new Date(s.startedAt).toISOString(),
      source: s.source ?? "",
      entry_page: s.persona ?? "",
      first_page: s.firstModule ?? "",
      pages_visited: String(s.path.length),
      path: s.path.map((p) => p.moduleId).join(" > "),
      drop_off_page: s.path.length ? s.path[s.path.length - 1].moduleId : "",
      total_seconds: String(
        Math.round(
          s.path.reduce(
            (acc, p) => acc + ((p.exitedAt ?? p.enteredAt) - p.enteredAt),
            0
          ) / 1000
        )
      ),
      clarity: s.clarity ?? "",
      completed_pre: s.surveys?.some((x) => x.phase === "pre") ? "yes" : "no",
      completed_post: s.surveys?.some((x) => x.phase === "post") ? "yes" : "no",
    };

    for (const sv of s.surveys ?? []) {
      Object.assign(row, flatten(sv.phase, sv.answers));
    }
    for (const m of s.microSurveys ?? []) {
      row[`micro_${m.threadCode}`] = m.answer;
    }
    for (const f of s.stubFeedback ?? []) {
      row[`feedback_${f.pageCode}`] = f.text;
    }
    rows.push(row);
  }

  // union of all columns, stable order
  const cols: string[] = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  }

  const lines = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => csvEscape(r[c] ?? "")).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hpdst-results.csv";
  a.click();
  URL.revokeObjectURL(url);
}
