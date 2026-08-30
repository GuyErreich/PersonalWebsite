# AGENTS.md

Project context, conventions, and validate commands live in the `AGENT.md` chain
(start at the repository-root `AGENT.md`) and `README.md`. Read those first.

## Cursor Cloud specific instructions

This repo is a **frontend-only** React 19 + TypeScript + Vite single-page portfolio.
There is no backend server to run locally — Supabase (Postgres/Auth) and Cloudflare R2
are external services and are optional for local development.

- **Run / lint / build / dev commands:** see the `## Validate` block in the root `AGENT.md`
  (`npm run dev`, `npm run lint`, `npm run build`). Dev server serves on `http://127.0.0.1:5173/`.
- **Required env to even render (non-obvious):** the SPA reads `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` at startup. Without them the root crashes to a **black screen**
  (`useAdminIdleLogout` in `src/hooks/auth/useAdminIdleLogout.ts` subscribes to
  `supabase.auth` synchronously, and the `supabase` proxy throws when unconfigured —
  despite the "graceful degradation" comment in `src/lib/supabase.ts`). The startup
  update script seeds a gitignored `.env.local` with **placeholder** values so the public
  portfolio (Hero / Game Dev / DevOps / About sections, 3D backgrounds, paged scroll
  navigation) renders. `.env.local` is gitignored (`*.local`) and never committed.
- **What placeholders do NOT enable:** admin panel (`/admin`), login (`/login`), and any
  DB-backed content require **real** Supabase credentials (see `.env.example` / `README.md`).
  With placeholders those areas stay empty or unauthenticated — expected for UI dev.
- **Edge-function / R2 testing:** the `r2-presign` edge function rejects loopback origins,
  so upload/edge flows cannot be tested against `npm run dev`; see `README.md` (Environment
  Variables) for the deployed-preview workflow and `npm run infra:*` / `npm run security:test:*`.
- **Hero intro lock:** on a first visit the Hero locks scrolling for ~25s for the cinematic
  intro; a cookie skips it on return visits. Allow for this when scripting navigation.
