import { marked } from "marked";

export const MAX_UPLOAD_BYTES = 1_000_000; // 1 MB
export const ALLOWED_EXTENSIONS = [".txt", ".md"] as const;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain text -> paragraphs; blank lines separate paragraphs, single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Markdown -> HTML. Raw HTML in the markdown is escaped, not rendered. */
export function markdownToHtml(md: string): string {
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => escapeHtml(text);
  return marked.parse(md, { async: false, renderer, gfm: true }) as string;
}

export function fileToDocument(name: string, text: string): { title: string; content: string } {
  const lower = name.toLowerCase();
  const ext = ALLOWED_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!ext) throw new Error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
  const title = name.slice(0, -ext.length).trim().slice(0, 200) || "Untitled";
  return { title, content: ext === ".md" ? markdownToHtml(text) : textToHtml(text) };
}
