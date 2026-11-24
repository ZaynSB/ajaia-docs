import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureSchema, sql, type User } from "./db";

// Mocked auth: the selected user id lives in an httpOnly cookie. Replace with real auth (e.g. NextAuth) in production.
export const SESSION_COOKIE = "uid";

export async function currentUser(): Promise<User | null> {
  await ensureSchema();
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = Number(raw);
  if (!Number.isInteger(id)) return null;
  const rows = (await sql`SELECT id, email, name FROM users WHERE id = ${id}`) as User[];
  return rows[0] ?? null;
}

export const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status });
