import { NextResponse } from "next/server";
import { fileToDocument, MAX_UPLOAD_BYTES } from "@/lib/convert";
import { sql } from "@/lib/db";
import { currentUser, jsonError } from "@/lib/session";

// Upload a .txt or .md file -> new editable document owned by the current user.
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return jsonError(401, "Choose a user first");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError(400, "No file uploaded");
  if (file.size === 0) return jsonError(400, "The file is empty");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError(413, "File is larger than 1 MB");
  let parsed;
  try {
    parsed = fileToDocument(file.name, await file.text());
  } catch (e) {
    return jsonError(415, e instanceof Error ? e.message : "Unsupported file");
  }
  const rows = await sql`
    INSERT INTO documents (owner_id, title, content) VALUES (${me.id}, ${parsed.title}, ${parsed.content})
    RETURNING id, title`;
  return NextResponse.json(rows[0], { status: 201 });
}
