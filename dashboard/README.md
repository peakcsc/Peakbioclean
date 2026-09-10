# Peak Bio Clean — Lead Command Center

This version makes lead outreach the default dashboard instead of exposing every operational tool at once.

## Home screen
- Searchable lead list
- Status, ICP and contact-method filters
- One-click Email, SMS and Call actions
- Automatic outreach history after HighLevel sends
- Manual call / voicemail / DM / in-person logging
- Next follow-up scheduling
- Per-lead contact timeline
- Daily outreach queue
- Follow-up queue
- Global outreach activity timeline

## Operations
The original dashboard is preserved at `/api/legacy`. Job Operations remains at `/api/operations`.

## Backend
Uses the existing Peak BioClean Supabase project and existing secure HighLevel connection. The private HighLevel token is not stored in this project. `/api/lead-outreach` securely proxies the signed-in user's request to the Supabase Edge Function.

Recommended permanent domain: `dashboard.peakbioclean.com`.

## Weekend builds (Sep 2026)

Four new tabs added to the same dashboard, no new hosting, no new bills:

| Tab | What it does |
|---|---|
| **☀ Morning Briefing** | One screen: overdue/due-today follow-ups, last night's Review Agent result, and this week's posting cadence. |
| **🗂 Job History** | Full-text search across every lead and every logged touch — the start of a real job archive. |
| **🧠 Second Brain** | Save SOPs, contracts, client policies, pricing rules. Ask a question and it searches your docs (and, if `OPENAI_API_KEY` is set, summarizes an answer from them — optional, off by default). |
| **🎨 Brand Kit** | Colors, voice rules, caption formula and hashtag bank pulled from `brand-kit.json`, plus a quick log for published posts that feeds the Briefing and Review Agent. |

A fifth piece runs with no UI: **`/api/nightly-review`**, wired to Vercel Cron (see `vercel.json`, 11:00 UTC / 7am ET) — it reports on the Eastern-time day that just ended, checking what shipped (outreach logged, posts published, leads moved to Partner) against what slipped (follow-ups still overdue, nothing posted, no outreach), writes it to `daily_review_log`, and emails the report using the same Gmail credentials as lead outreach.

Every date comparison in that job runs through `Intl.DateTimeFormat` in `America/New_York`. Vercel executes in UTC, so comparing against the server's own calendar day puts an evening touch in Florida on the following day and the report comes back empty.

### One-time setup
1. Run `dashboard/supabase/weekend-builds.sql` once in the Supabase SQL editor for this project — it creates `brain_docs`, `content_log`, and `daily_review_log` with RLS open to the anon key, matching how every other table in this app already works. Safe to re-run.
2. Deploy as usual (Vercel picks up `/api/nightly-review` and the cron entry automatically).
3. Everything else — Briefing, Job History, Second Brain, Brand Kit — works immediately, no keys required. `OPENAI_API_KEY` is optional and only upgrades Second Brain search into a synthesized answer.

### Why this shape
Peak Bio-Clean is brand new — no budget for a CRM add-on, a wiki tool, or a reporting SaaS. Every one of these reuses the Supabase project, Vercel deploy, and Gmail sending that already exist, so the marginal cost is $0. `brand/brand-kit.md` at the repo root is the same content in a format built for Claude to reference when writing posts, emails, or client copy — keep it and `brand-kit.json` in sync if the brand changes.
