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
