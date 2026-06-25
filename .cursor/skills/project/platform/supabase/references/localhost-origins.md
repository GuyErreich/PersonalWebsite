# Localhost and ALLOWED_ORIGINS

**Localhost / loopback origins are never allowed in `ALLOWED_ORIGINS`.**

Every user runs a local dev server, so `localhost`, `127.0.0.1`, and `[::1]` are not meaningful origin boundaries for Supabase edge-function CORS. They are filtered out by `parseAllowedOrigins` in all environments (production, preview, and branch).

## Local testing workflow

Test edge functions and browser uploads from a **deployed preview origin** (e.g. Cloudflare Pages dev URL), not from `npm run dev` against production Supabase secrets.

When you need schema or auth changes isolated from production, use a Supabase branch with preview URLs in `ALLOWED_ORIGINS` — still no localhost. See [Branch Testing Workflow](./branch-testing-workflow.md).
