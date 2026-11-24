# Architecture note

## Shape

One Next.js 16 app (App Router) deployed on Vercel: React pages for the UI, Route Handlers for the API, Postgres on Neon for storage.

```
Browser ── React pages (/, /docs/[id]) ── Tiptap editor
   │  fetch JSON / multipart
   ▼
Route Handlers (/api/*) ── session cookie (mock auth) ── access rules (lib/access.ts)
   │  parameterised SQL (Neon serverless driver)
   ▼
Postgres: users · documents(owner_id, title, content HTML) · document_shares(document_id, user_id)
```

| Endpoint | Purpose |
| --- | --- |
| `GET /api/users`, `POST /api/session` | List seeded users, switch user (httpOnly cookie) |
| `GET/POST /api/documents` | Owned + shared lists; create |
| `GET/PATCH /api/documents/:id` | Open; rename and/or save content |
| `POST/DELETE /api/documents/:id/share` | Owner grants / removes access by email |
| `POST /api/upload` | .txt/.md file → new document |

## What I prioritised and why

1. **A working end-to-end slice on a live URL** before anything else: one deployable app instead of a separate frontend and backend avoided a second deployment and CORS setup.
2. **Editing quality:** Tiptap (ProseMirror) gives reliable rich text with lists and headings; a debounced autosave with a visible status removes the need for a Save button, and unsaved changes are kept and retried if a save fails.
3. **Correct access control:** every document request checks the caller's role on the server (`owner`, `editor` or none). The rules are a pure function so they are unit-tested independently of the database.
4. **Safe file import:** type and size checks; raw HTML in uploaded text or Markdown is escaped; content is only rendered through the editor's schema, never injected as raw HTML.

## Decisions and trade-offs

| Decision | Why | Cost / later |
| --- | --- | --- |
| Mocked auth with seeded users | Reviewers can test sharing in seconds without sign-up | Replace with real auth (e.g. NextAuth / OAuth) before real use |
| Content stored as HTML | Native Tiptap output, simple to persist and reload | Tiptap JSON would be better for diffing, versions and real-time sync |
| Neon Postgres (HTTP driver) | Free, works on serverless without a connection pool, real relational constraints | — |
| Schema created on first request | Zero setup steps for reviewers | Use proper migrations as the schema grows |
| Shared users can edit (single role) | Meets the brief with clear rules | Viewer/commenter roles are a small extension of `roleFor` |
| Last-write-wins saving | Simple and predictable for a single editor at a time | Real-time co-editing (Yjs/CRDT) for concurrent edits |

## Deliberately not built

Real-time collaboration, comments/suggestions, version history, .docx import, export, real authentication, pagination. Each was cut to keep the core flows solid within the timebox.

## Next 2–4 hours

1. Version history (snapshot on save, restore) and conflict warning when two users edit the same document.
2. `.docx` import via `mammoth` and export to Markdown/PDF.
3. Viewer vs editor roles; API integration tests against a test database.
