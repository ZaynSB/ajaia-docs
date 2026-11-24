import { roleFor, type Role } from "./access";
import { sql, type Doc } from "./db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads a document and the caller's role. Returns null if it doesn't exist (or the id is malformed). */
export async function loadDocWithRole(id: string, userId: number): Promise<{ doc: Doc; role: Role | null } | null> {
  if (!UUID.test(id)) return null;
  const docs = (await sql`SELECT * FROM documents WHERE id = ${id}`) as Doc[];
  const doc = docs[0];
  if (!doc) return null;
  const shares = (await sql`SELECT user_id FROM document_shares WHERE document_id = ${id}`) as { user_id: number }[];
  return { doc, role: roleFor(doc, shares.map((s) => s.user_id), userId) };
}

export const MAX_TITLE = 200;
export const MAX_CONTENT = 500_000; // ~500 KB of HTML per document
