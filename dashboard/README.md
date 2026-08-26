# Peak Bio Clean Dashboard — Vercel Export

This is a deploy-ready copy of the Peak Bio Clean operating dashboard.

## What stays connected

The dashboard continues using the existing Peak BioClean Supabase backend, authentication, job database, private job-file storage, GoHighLevel connection stored in Supabase Vault, 52-field intake map, Job Operations workflows, compliance/readiness records, document templates and customer-signature backend.

No HighLevel private token or other private credential is included in this export.

The included `/api/highlevel` and `/api/job-ops` serverless proxies make the dashboard portable to a new Vercel domain without needing to change the current Supabase Edge Function CORS allowlists.

## Deploy to the other Vercel account

1. Upload this folder to a Git repository or deploy it with the Vercel CLI while signed into the destination account.
2. Framework preset: Other / no framework.
3. Build command: leave blank.
4. Output directory: leave blank.
5. Deploy.
6. Add `dashboard.peakbioclean.com` under Project Settings > Domains.
7. Keep Vercel Authentication disabled for Production if you want the Peak BioClean Cloud login inside the dashboard to be the login layer.

## Optional environment variables

The core database, intake, HighLevel, Job Operations, documents, signatures, logs and file storage work without Vercel secrets.

Only add values from `.env.example` if you want the optional Twilio SMS, OpenAI planning/image tools or BlueBubbles health indicator.

## Routes

- `/` — opens dashboard
- `/api/dashboard` — main dashboard
- `/api/operations` — Job Operations & Compliance
- `/api/highlevel` — secure same-origin proxy to existing Supabase HighLevel function
- `/api/job-ops` — secure same-origin proxy to existing Supabase Job Operations function
- `/api/action` — optional SMS/AI actions

## Customer signature links

Customer signature pages are served by the existing Supabase `customer-sign` function. They remain valid independently of the Vercel account/domain.
