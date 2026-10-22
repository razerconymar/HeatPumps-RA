// Research instrumentation: what the tool records about a session.
//
// Signals: entry question, first page, full navigation path, drop-off point,
// time per page, survey answers, page ratings and end-of-session clarity.
//
// No personal information. Sessions use an anonymous random token, logging is
// in-memory array pushes with no network calls during navigation, and data
// stays in the browser's localStorage. That last part is a known limitation:
// it means data only reaches the team when someone exports it from the device
// that produced it. Remote collection needs a POST endpoint added here.

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
  source: string | null; // e.g. "qualtrics-focus-group", null = organic visit
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

// Adopt an externally-supplied anonymous token (from the pre-survey
// redirect) so survey responses and tool activity can be joined later.
// Sanitized and length-capped since it arrives from a URL parameter.
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
    // storage unavailable — fail silently, never break the journey
  }
  syncToServer(session);
}

// ── Server sync ─────────────────────────────────────────────
//
// Sends the session to /api/session so answers reach the team even when the
// participant is on their own device. Local storage is kept as a backup, so a
// session is never lost if the network is down.
//
// Debounced: a burst of logging produces one request, not ten. Failures are
// swallowed on purpose — a participant's session must never break because the
// database is unreachable, and the next event retries anyway.

let syncTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSession: SessionLog | undefined;

function syncToServer(session: SessionLog): void {
  if (typeof window === "undefined") return;
  pendingSession = session;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(flushToServer, 1500);
}

function flushToServer(): void {
  const session = pendingSession;
  if (!session) return;
  pendingSession = undefined;
  try {
    void fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // offline or blocked — local storage still holds the session
  }
}

// Last-ditch flush when the tab closes, so a drop-off mid-session is still
// recorded. sendBeacon survives page unload where a normal fetch would not.
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" || !pendingSession) return;
    try {
      const blob = new Blob([JSON.stringify(pendingSession)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/session", blob);
      pendingSession = undefined;
    } catch {
      // nothing more to try
    }
  });
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
