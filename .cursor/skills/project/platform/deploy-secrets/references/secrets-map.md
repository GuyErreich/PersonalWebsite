# Secrets map — Cloudflare, Supabase, GitHub

One-page reference for this repo. Values are examples; replace with yours.

## Architecture

```
Browser (Pages origin)
    → POST Supabase edge function (ALLOWED_ORIGINS on Supabase)
    → PUT  R2 via presigned URL (R2_* on Supabase + bucket CORS on Cloudflare)

GitHub Actions (deploy.yml)
    → smoke tests call live edge functions (Origin from GitHub ALLOWED_ORIGINS)
    → build uses VITE_SUPABASE_*
    → deploy uses CLOUDFLARE_*
```

---

## 1. Cloudflare — where to get each value

### R2 S3 credentials (runtime uploads/deletes)

**Dashboard:** R2 object storage → **API Tokens** → **Create Account API token**

| Pick | Value |
|---|---|
| Permission | **Object Read & Write** (runtime) or **Admin Read & Write** (CORS/infra only) |
| Bucket | `personal-website-gam3plify` (scope to one bucket for runtime) |
| Token type | **Account API token** (recommended for Supabase) |

| Copy from Cloudflare | Goes to |
|---|---|
| Access Key ID | Supabase `R2_ACCESS_KEY_ID` |
| Secret Access Key | Supabase `R2_SECRET_ACCESS_KEY` |
| Account ID (sidebar / Workers & Pages overview) | Supabase `R2_ACCOUNT_ID` |
| Bucket name | Supabase `R2_BUCKET_NAME` |
| Public bucket URL (`https://pub-….r2.dev`) | Supabase `R2_PUBLIC_URL` |
| Token value (top of R2 token page) | **Do not** use for Supabase S3 — different API |

Endpoint: **Default** → `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (already hardcoded in edge functions).

### Cloudflare API token (Pages deploy + cleanup)

**Dashboard:** My Profile → **API Tokens** → Create token with **Cloudflare Pages** (and Account read as needed)

| Copy | Goes to |
|---|---|
| Token value | GitHub `CLOUDFLARE_API_TOKEN` |
| Account ID | GitHub `CLOUDFLARE_ACCOUNT_ID` (same as Supabase `R2_ACCOUNT_ID`) |
| Pages project name | GitHub `CLOUDFLARE_PAGES_PROJECT_NAME` |

### R2 bucket CORS (browser PUT)

Separate from Supabase `ALLOWED_ORIGINS`. Same origin URLs, applied to the bucket:

- Dashboard: R2 → bucket → Settings → CORS policy, or
- Local: `npm run infra:apply-r2-cors` (needs Admin-capable R2 credentials in `.env.local`)

---

## 2. Supabase — `npx supabase secrets set`

Edge function runtime. Set after `npx supabase link`.

```bash
# R2 (from R2 → API Tokens → S3 credentials)
npx supabase secrets set R2_ACCOUNT_ID="<cloudflare-account-id>"
npx supabase secrets set R2_ACCESS_KEY_ID="<access-key-id>"
npx supabase secrets set R2_SECRET_ACCESS_KEY="<secret-access-key>"
npx supabase secrets set R2_BUCKET_NAME="personal-website-gam3plify"
npx supabase secrets set R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# CORS for edge functions (preview/production URLs only — no localhost)
npx supabase secrets set ALLOWED_ORIGINS="https://dev.personal-website-5f5.pages.dev"

# github-project-seed only
npx supabase secrets set GITHUB_TOKEN="<github-pat-with-repo-read>"

# Optional
npx supabase secrets set LOG_LEVEL="info"
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically for edge functions — do not set manually unless debugging.

**Redeploy after changes:**

```bash
npx supabase functions deploy r2-presign
npx supabase functions deploy github-project-seed
```

**List secret names:** `npx supabase secrets list`

---

## 3. GitHub — `gh secret set`

Repository secrets (Settings → Secrets and variables → Actions). From repo root:

```bash
REPO="GuyErreich/PersonalWebsite"   # optional if cwd is git root

# Must match Supabase ALLOWED_ORIGINS (smoke test Origin header)
command gh secret set ALLOWED_ORIGINS --body "https://dev.personal-website-5f5.pages.dev" --repo "$REPO"
command gh secret set ALLOWED_ORIGIN  --body "https://dev.personal-website-5f5.pages.dev" --repo "$REPO"

# Cloudflare Pages deploy
command gh secret set CLOUDFLARE_API_TOKEN          --body "<pages-api-token>" --repo "$REPO"
command gh secret set CLOUDFLARE_ACCOUNT_ID         --body "<account-id>"       --repo "$REPO"
command gh secret set CLOUDFLARE_PAGES_PROJECT_NAME --body "<pages-project>"    --repo "$REPO"

# Vite build + smoke tests (Supabase Dashboard → Settings → API)
command gh secret set VITE_SUPABASE_URL       --body "https://<ref>.supabase.co" --repo "$REPO"
command gh secret set VITE_SUPABASE_ANON_KEY  --body "<anon-key>"                --repo "$REPO"
command gh secret set SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"      --repo "$REPO"

# Optional fallbacks (workflows derive URLs from VITE_SUPABASE_URL if unset)
command gh secret set PRESIGN_URL       --body "https://<ref>.supabase.co/functions/v1/r2-presign" --repo "$REPO"
command gh secret set PROJECT_SEED_URL  --body "https://<ref>.supabase.co/functions/v1/github-project-seed" --repo "$REPO"
```

**Avoid shell history for sensitive values:**

```bash
read -s -p "Secret: " VAL; echo
command gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$VAL"
unset VAL
```

**List names:** `command gh secret list --repo "$REPO"`

**Re-run deploy:**

```bash
command gh run list --workflow deploy.yml --limit 3
command gh run rerun <run-id>
```

---

## 4. Local only — `.env.local`

Copy from `.env.example`. Used by `npm run infra:*` and local smoke tests. **Never commit.**

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 5. Sync checklist (avoid deploy gate failures)

| Must match | Why |
|---|---|
| GitHub `ALLOWED_ORIGINS` ↔ Supabase `ALLOWED_ORIGINS` | Smoke tests send `Origin`; edge functions enforce CORS |
| Supabase `ALLOWED_ORIGINS` ↔ R2 bucket CORS origins | Browser PUT to R2 after presign |
| Supabase `R2_*` ↔ Account R2 token (Object R&W, right bucket) | Presign + delete over S3 API |

---

## 6. Quick smoke test (local)

```bash
ALLOWED_ORIGIN=https://dev.personal-website-5f5.pages.dev \
PRESIGN_URL=https://<ref>.supabase.co/functions/v1/r2-presign \
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_ANON_KEY=<anon> \
SUPABASE_SERVICE_ROLE_KEY=<service-role> \
npm run security:test:r2-presign
```
