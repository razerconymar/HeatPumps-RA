// Downloads every stored session as a CSV, in the shape the team asked for:
// one row per participant, one column per answer, plus usage statistics.
//
// Protected by EXPORT_SECRET. Without it set, the route refuses to run at all
// rather than defaulting to open, so a missing environment variable can never
// expose the research data.
//
//   /api/export?key=<EXPORT_SECRET>

import { NextRequest, NextResponse } from "next/server";
import { allSessions } from "@/lib/db";

export const runtime = "edge";

interface Visit {
  moduleId: string;
  enteredAt: number;
  exitedAt: number | null;
}

function flatten(prefix: string, answers: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [qid, val] of Object.entries(answers ?? {})) {
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
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function GET(req: NextRequest) {
  const secret = process.env.EXPORT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "EXPORT_SECRET is not configured" },
      { status: 503 }
    );
  }
  if (req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessions = await allSessions();
  const rows: Record<string, string>[] = [];

  for (const s of sessions) {
    const p = s.payload as Record<string, any>;
    const path: Visit[] = Array.isArray(p.path) ? p.path : [];
    const totalSeconds = Math.round(
      path.reduce((a, v) => a + ((v.exitedAt ?? v.enteredAt) - v.enteredAt), 0) / 1000
    );
    const distinctPages = new Set(
      path.map((v) => v.moduleId).filter((id) => id !== "CALC" && !id.startsWith("priority:"))
    ).size;

    const row: Record<string, string> = {
      participant_id: s.token,
      condition: s.condition ?? "",
      started_at: s.started_at ?? "",
      last_activity: s.updated_at,
      pages_visited: String(distinctPages),
      page_path: path.map((v) => v.moduleId).join(" > "),
      drop_off_page: path.length ? path[path.length - 1].moduleId : "",
      total_seconds: String(totalSeconds),
      used_calculator: path.some((v) => v.moduleId === "CALC") ? "yes" : "no",
      completed_pre: (p.surveys ?? []).some((x: any) => x.phase === "pre") ? "yes" : "no",
      completed_post: (p.surveys ?? []).some((x: any) => x.phase === "post") ? "yes" : "no",
    };

    for (const sv of p.surveys ?? []) {
      Object.assign(row, flatten(sv.phase, sv.answers));
    }
    for (const m of p.microSurveys ?? []) {
      row[`micro_${m.threadCode}`] = m.answer;
    }
    for (const f of p.stubFeedback ?? []) {
      row[`feedback_${f.pageCode}`] = f.text;
    }
    rows.push(row);
  }

  const cols: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);

  const csv = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => csvEscape(r[c] ?? "")).join(",")),
  ].join("\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hpdst-results-${stamp}.csv"`,
    },
  });
}
