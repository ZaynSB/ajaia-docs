import { NextResponse } from "next/server";
import { canShare } from "@/lib/access";
import { sql } from "@/lib/db";
import { loadDocWithRole } from "@/lib/documents";
import { currentUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

// Owner grants another user edit access by email.
export async function POST(req: Request, { params }: Ctx) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const found = await loadDocWithRole((await params).id, me.id);
  if (!found) return jsonError(404, "Document not found");
  if (!canShare(found.role)) return jsonError(403, "Only the owner can share this document");

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return jsonError(400, "Email is required");
  const users = (await sql`SELECT id, email, name FROM users WHERE lower(email) = ${email}`) as { id: number; email: string; name: string }[];
  const target = users[0];
  if (!target) return jsonError(404, "No user with that email");
  if (target.id === me.id) return jsonError(400, "You already own this document");
  await sql`INSERT INTO document_shares (document_id, user_id) VALUES (${found.doc.id}, ${target.id}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ sharedWith: target }, { status: 201 });
}

// Owner removes access.
export async function DELETE(req: Request, { params }: Ctx) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const found = await loadDocWithRole((await params).id, me.id);
  if (!found) return jsonError(404, "Document not found");
  if (!canShare(found.role)) return jsonError(403, "Only the owner can change sharing");
  const userId = Number(new URL(req.url).searchParams.get("userId"));
  if (!Number.isInteger(userId)) return jsonError(400, "userId is required");
  await sql`DELETE FROM document_shares WHERE document_id = ${found.doc.id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
