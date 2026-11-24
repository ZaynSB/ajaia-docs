import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { currentUser } from "@/lib/session";

// Lists seeded users (for the user switcher) and who is signed in.
export async function GET() {
  await ensureSchema();
  const users = await sql`SELECT id, email, name FROM users ORDER BY id`;
  return NextResponse.json({ users, me: await currentUser() });
}
