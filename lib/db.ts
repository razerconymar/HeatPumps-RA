// Database access for research sessions.
//
// One row per participant, keyed by their anonymous session token. The whole
// session is stored as JSONB and overwritten as it grows, so a participant who
// drops out halfway still leaves a usable partial record.
//
// JSONB rather than a column per answer: survey questions change, and a schema
// migration every time a question is reworded would be a liability during a
// study. The CSV export flattens it into one column per answer at export time.
//
// No personal information is stored. The token is random and not tied to any
// identity, which is what keeps this separable from any follow-up contact list.

import { neon } from "@neondatabase/serverless";

/** Null when DATABASE_URL is unset, so local dev works without a database. */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export async function ensureTable(): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      condition   TEXT,
      started_at  TIMESTAMPTZ,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload     JSONB NOT NULL
    )
  `;
}

export interface SessionRow {
  token: string;
  condition: string | null;
  started_at: string | null;
  updated_at: string;
  payload: Record<string, unknown>;
}

/** Insert or overwrite one participant's record. */
export async function saveSession(
  token: string,
  condition: string | null,
  startedAt: number | null,
  payload: unknown
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await ensureTable();
  const started = startedAt ? new Date(startedAt).toISOString() : null;
  await sql`
    INSERT INTO sessions (token, condition, started_at, payload)
    VALUES (${token}, ${condition}, ${started}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (token) DO UPDATE
      SET payload    = EXCLUDED.payload,
          condition  = COALESCE(EXCLUDED.condition, sessions.condition),
          updated_at = NOW()
  `;
}

export async function allSessions(): Promise<SessionRow[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureTable();
  const rows = await sql`
    SELECT token, condition, started_at, updated_at, payload
    FROM sessions
    ORDER BY started_at NULLS LAST
  `;
  return rows as SessionRow[];
}
