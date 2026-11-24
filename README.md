# Ajaia Docs

A lightweight collaborative document editor: create, format, import and share documents.

- **Live app:** https://ajaia-docs-wine-nine.vercel.app
- **Test accounts:** no passwords (auth is mocked). Use the "Signed in as" switcher: **Alice** (`alice@ajaia.test`), **Bob** (`bob@ajaia.test`), **Carol** (`carol@ajaia.test`).

## What works

| Area | Behaviour |
| --- | --- |
| Documents | Create, rename (click the title), edit in the browser, autosave (~0.8 s after typing stops), reopen from the list, delete (owner only, with confirmation) |
| Formatting | Bold, italic, underline, headings H1–H3, bulleted and numbered lists, undo/redo |
| File upload | Import a **.txt or .md** file (max 1 MB) → becomes a new editable document; Markdown headings, lists and emphasis are preserved |
| Sharing | Owner shares by email and can remove access; shared users can edit but not re-share; home page separates **My documents** and **Shared with me** |
| Persistence | Postgres (Neon). Documents, formatting (stored as HTML) and shares survive refresh and redeploys |
| Quality | Input validation (title/content size, file type/size, ids), clear error messages, 8 unit tests |

## Try the sharing flow (2 minutes)

1. Sign in as **Alice** → **+ New document** → type and format some text → rename it.
2. In the Sharing panel, share with `bob@ajaia.test`.
3. Switch to **Bob** → the document appears under **Shared with me** → Bob can edit it.
4. Switch to **Carol** → she cannot see it; opening its URL directly returns "You don't have access to this document".

## Run locally

Requirements: Node.js 20+, a free Postgres database (e.g. [Neon](https://neon.tech)).

```bash
git clone https://github.com/ZaynSB/ajaia-docs.git
cd ajaia-docs
npm install
echo DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require > .env.local
npm run dev        # http://localhost:3000
npm test           # unit tests
```

Tables are created and test users seeded automatically on the first request; there is no migration step.

## Deploy

Vercel (free) + Neon Postgres via Vercel's Storage integration, which sets `DATABASE_URL`. Push to `main` → Vercel builds and deploys.

## Supported imports

Only **.txt** and **.md**, up to **1 MB**. This is stated in the UI. `.docx` is a planned next step.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md): design, priorities and trade-offs
- [AI_WORKFLOW.md](AI_WORKFLOW.md): how AI tools were used and verified
- [SUBMISSION.md](SUBMISSION.md): what is included
