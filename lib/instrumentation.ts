// ─────────────────────────────────────────────────────────────
// Minimum viable research instrumentation
//
// Implements exactly the six signals defined in the project's
// research instrumentation spec, and nothing more:
//   1. Persona selected at entry
//   2. First module selected
//   3. Full navigation path (ordered module ids)
//   4. Drop-off point (last module before exit)
//   5. Time per module (entry/exit timestamps)
//   6. Self-reported clarity at session end
//
// Privacy constraints:
//   - No PII. Sessions use an anonymous random token.
//   - Data stays in the browser (localStorage) in v1.
//     A later phase can POST the same payload to an endpoint.
//   - All logging is synchronous-cheap (array pushes); no
//     network calls during navigation.
// ─────────────────────────────────────────────────────────────

export interface ModuleVisit {
  moduleId: string;
  enteredAt: number;
  exitedAt: number | null;
}

export interface SessionLog {
  sessionToken: string;
  startedAt: number;
  persona: string | null;
  firstModule: string | null;
  path: ModuleVisit[];
  clarity: "yes" | "somewhat" | "no" | null;
}

const STORAGE_KEY = "hpdst_sessions";

function newToken(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createSession(): SessionLog {
  return {
    sessionToken: newToken(),
    startedAt: Date.now(),
    persona: null,
    firstModule: null,
    path: [],
    clarity: null,
  };
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
