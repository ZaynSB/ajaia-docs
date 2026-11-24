import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MAX_CONTENT, MAX_TITLE } from "@/lib/documents";
import { currentUser, jsonError } from "@/lib/session";

// Owned and shared documents for the current user.
export async function GET() {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const owned = await sql`
    SELECT id, title, updated_at FROM documents WHERE owner_id = ${me.id} ORDER BY updated_at DESC`;
  const shared = await sql`
    SELECT d.id, d.title, d.updated_at, u.name AS owner_name
    FROM document_shares s JOIN documents d ON d.id = s.document_id JOIN users u ON u.id = d.owner_id
    WHERE s.user_id = ${me.id} ORDER BY d.updated_at DESC`;
  return NextResponse.json({ owned, shared });
}

// Create a new document owned by the current user.
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "Untitled document";
  const content = typeof body?.content === "string" ? body.content : "";
  if (title.length > MAX_TITLE) return jsonError(400, `Title must be at most ${MAX_TITLE} characters`);
  if (content.length > MAX_CONTENT) return jsonError(413, "Document is too large");
  const rows = await sql`
    INSERT INTO documents (owner_id, title, content) VALUES (${me.id}, ${title}, ${content})
    RETURNING id, title`;
  return NextResponse.json(rows[0], { status: 201 });
}
