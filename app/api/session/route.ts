import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { jsonError, SESSION_COOKIE } from "@/lib/session";

// "Sign in" as a seeded user (mocked auth).
export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => null);
  const userId = Number(body?.userId);
  if (!Number.isInteger(userId)) return jsonError(400, "userId is required");
  const rows = await sql`SELECT id FROM users WHERE id = ${userId}`;
  if (rows.length === 0) return jsonError(404, "Unknown user");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, String(userId), { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}
