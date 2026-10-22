// Receives a participant's session and stores it.
//
// Called whenever something meaningful happens (survey submitted, page
// visited, session finished) rather than only at the end, so a participant
// who abandons partway still leaves a usable record.

import { NextRequest, NextResponse } from "next/server";
import { saveSession } from "@/lib/db";

export const runtime = "edge";

const TOKEN_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const token = payload?.sessionToken;

  if (typeof token !== "string" || !TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }

  // Reject anything oversized rather than letting one client fill the table.
  const size = JSON.stringify(payload).length;
  if (size > 200_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  const condition = typeof payload.source === "string" ? payload.source : null;
  const startedAt = typeof payload.startedAt === "number" ? payload.startedAt : null;

  try {
    await saveSession(token, condition, startedAt, payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("session save failed", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
