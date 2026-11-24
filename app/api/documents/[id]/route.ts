import { NextResponse } from "next/server";
import { canDelete, canEdit } from "@/lib/access";
import { sql } from "@/lib/db";
import { loadDocWithRole, MAX_CONTENT, MAX_TITLE } from "@/lib/documents";
import { currentUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const found = await loadDocWithRole((await params).id, me.id);
  if (!found) return jsonError(404, "Document not found");
  if (!found.role) return jsonError(403, "You don't have access to this document");
  const sharedWith = await sql`
    SELECT u.id, u.email, u.name FROM document_shares s JOIN users u ON u.id = s.user_id
    WHERE s.document_id = ${found.doc.id} ORDER BY u.name`;
  const owner = await sql`SELECT name, email FROM users WHERE id = ${found.doc.owner_id}`;
  return NextResponse.json({ ...found.doc, role: found.role, owner: owner[0], sharedWith });
}

// Rename and/or save content. Owners and shared users can edit.
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const found = await loadDocWithRole((await params).id, me.id);
  if (!found) return jsonError(404, "Document not found");
  if (!canEdit(found.role)) return jsonError(403, "You don't have access to this document");

  const body = await req.json().catch(() => null);
  if (!body || (body.title === undefined && body.content === undefined)) return jsonError(400, "Nothing to update");
  let title = found.doc.title;
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return jsonError(400, "Title can't be empty");
    if (body.title.trim().length > MAX_TITLE) return jsonError(400, `Title must be at most ${MAX_TITLE} characters`);
    title = body.title.trim();
  }
  let content = found.doc.content;
  if (body.content !== undefined) {
    if (typeof body.content !== "string") return jsonError(400, "Invalid content");
    if (body.content.length > MAX_CONTENT) return jsonError(413, "Document is too large");
    content = body.content;
  }
  const rows = await sql`
    UPDATE documents SET title = ${title}, content = ${content}, updated_at = now()
    WHERE id = ${found.doc.id} RETURNING id, title, updated_at`;
  return NextResponse.json(rows[0]);
}

// Delete a document. Owner only; shares are removed by ON DELETE CASCADE.
export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const found = await loadDocWithRole((await params).id, me.id);
  if (!found) return jsonError(404, "Document not found");
  if (!canDelete(found.role)) return jsonError(403, "Only the owner can delete this document");
  await sql`DELETE FROM documents WHERE id = ${found.doc.id}`;
  return NextResponse.json({ ok: true });
}
