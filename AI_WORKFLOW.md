# AI workflow note

## Tools
- **Claude (chat assistant):** scoping the brief into a prioritised plan and time budget, first drafts of the code and docs, and diagnosing install/build errors.
- **VS Code + terminal:** reading every file, running tests, local dev server.
- **Vercel + Neon dashboards:** deployment and database setup (done manually).

## Where AI materially sped things up
- **Scoping in minutes:** turned the open brief into a prioritised plan with explicit cuts and a time budget.
- **Boilerplate:** API route handlers, the database schema, the Tiptap toolbar and the sharing panel.
- **Docs:** first drafts of README and this architecture note.

## What I changed or rejected
- **Stack:** rejected a separate FastAPI backend + Next.js frontend (my usual pattern) in favour of one Next.js app, to avoid a second deployment and CORS within the timebox.
- **Dependency:** the plan installed `@tiptap/extension-underline`, but Tiptap v3's StarterKit already includes underline; the extra package is unused.
- **Install error:** `vitest` failed to install due to a `@types/node` peer conflict; fixed by pinning `@types/node@^22` rather than forcing with `--legacy-peer-deps`.
- **Build error:** the first build failed because Next.js 16 Cache Components requires dynamic route reads (`useParams`) inside a `<Suspense>` boundary; moved the document view into a Suspense-wrapped component.
- **Deployment URL:** I first used the deployment-specific Vercel URL in the docs; switched to the public production domain because per-deployment URLs can require a Vercel login, which would block reviewers.
- **Scope decisions were mine:** accepted mocked auth and .txt/.md-only import as deliberate cuts so the core flows could be finished, tested and deployed inside the timebox.

## How I verified correctness, UX and reliability
- **Unit tests (8):** access rules (owner / shared editor / stranger / anonymous) and file conversion, including that `<script>` in uploads is escaped.
- **Manual end-to-end test, locally and on the live URL:** create → format → rename → refresh → share → switch user → stranger is denied → import .md.
- **Lint and production build** pass before each push.
- **Reviewed every generated file** before committing so I can explain each part.
- **Live test as three users:** on the production URL I created, formatted, renamed and refreshed a document as Alice, shared it with Bob and edited it as Bob, confirmed the document did not appear for Carol, and that opening its direct URL as Carol returns "You don't have access to this document" (server-side check, not just a hidden link), and imported a .md file.
