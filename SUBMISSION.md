# Submission: Ajaia Docs

**Candidate:** Zain Shafique Butt (buttzain59@yahoo.com)

## Links
- **Live app:** https://ajaia-docs-wine-nine.vercel.app
- **Source code:** https://github.com/ZaynSB/ajaia-docs (also in this folder)
- **Walkthrough video:** see `VIDEO_URL.txt`

## Test accounts
No passwords (mocked auth). Use the "Signed in as" switcher: Alice, Bob, Carol (`alice@`, `bob@`, `carol@ajaia.test`). Suggested flow: Alice creates and shares a document with `bob@ajaia.test`, then switch to Bob and Carol.

## Included
| Item | File |
| --- | --- |
| Source code | `ajaia-docs/` (Next.js app) |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Walkthrough video link | `VIDEO_URL.txt` |
| Automated tests | `lib/access.test.ts`, `lib/convert.test.ts` (`npm test`) |

## Status
**Working end to end:** create, rename, delete (owner only), rich-text editing (bold, italic, underline, H1–H3, lists), autosave and reopen; .txt/.md import into a new document; owner-based sharing by email with remove access; "My documents" vs "Shared with me"; Postgres persistence; validation and error messages; deployed on Vercel.

**Incomplete / not built:** real authentication, real-time co-editing, comments, version history, .docx import, export.

**Next 2–4 hours:** version history with restore and edit-conflict warning; .docx import and Markdown/PDF export; viewer vs editor roles; API integration tests.
