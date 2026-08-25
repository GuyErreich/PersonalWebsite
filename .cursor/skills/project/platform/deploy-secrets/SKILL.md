---
name: deploy-secrets
description: >-
  Rotate or set Cloudflare, Supabase, and GitHub secrets for deploys and smoke
  tests. Use when updating R2 keys, ALLOWED_ORIGINS, API tokens, or asking how
  to put credentials in gh secret set / supabase secrets set.
disable-model-invocation: true
---

# Deploy Secrets (Cloudflare → Supabase → GitHub)

Load [Secrets map](./references/secrets-map.md) for the full cheat sheet.

## When to use

- Rotating R2, Cloudflare, or Supabase credentials
- Deploy smoke tests fail on CORS (403) or R2 delete (500)
- User asks how to set GitHub secrets from the shell

## Quick rule: three stores

| Store | Powers |
|---|---|
| **Supabase secrets** | Edge functions at runtime (`r2-presign`, `github-project-seed`) |
| **GitHub repo secrets** | CI build, deploy, security smoke tests |
| **`.env.local`** | Local infra scripts and smoke tests only (never commit) |

**Never** put R2 secret keys or service role keys in `VITE_*` or GitHub vars (non-secret).

## Cloudflare R2 token screen → where each field goes

When you create an **Account API token** on R2 → **API Tokens** (Object Read & Write, scoped to your bucket):

| Cloudflare shows | Put it in |
|---|---|
| **Access Key ID** | Supabase `R2_ACCESS_KEY_ID` |
| **Secret Access Key** | Supabase `R2_SECRET_ACCESS_KEY` |
| **Default** S3 endpoint | Code uses `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` — set `R2_ACCOUNT_ID` to your Cloudflare **account ID** (Dashboard → account sidebar) |
| **Token value** (top of page) | **Not** for Supabase S3 — only if you explicitly need that token for Cloudflare REST API |

Prefer **Account** tokens (not User) for Supabase production secrets.

## Shell: Supabase

From repo root, project linked via `npx supabase link`:

```bash
npx supabase secrets set R2_ACCESS_KEY_ID="<access-key-id>"
npx supabase secrets set R2_SECRET_ACCESS_KEY="<secret-access-key>"
npx supabase secrets set ALLOWED_ORIGINS="https://dev.personal-website-5f5.pages.dev"
```

After changing edge-function secrets, redeploy affected functions:

```bash
npx supabase functions deploy r2-presign
npx supabase functions deploy github-project-seed
```

List names only (values are hidden): `npx supabase secrets list`

## Shell: GitHub

From repo root (`gh` authenticated, git remote = this repo):

```bash
# Public URLs — safe as secrets; vars also work for origins
command gh secret set ALLOWED_ORIGINS --body "https://dev.personal-website-5f5.pages.dev"
command gh secret set ALLOWED_ORIGIN --body "https://dev.personal-website-5f5.pages.dev"

# Cloudflare Pages deploy (Profile → API Tokens, Pages permissions — not R2 S3 keys)
command gh secret set CLOUDFLARE_API_TOKEN --body "<token-value>"
command gh secret set CLOUDFLARE_ACCOUNT_ID --body "<account-id>"
command gh secret set CLOUDFLARE_PAGES_PROJECT_NAME --body "<pages-project-name>"

# Supabase (CI build + smoke tests)
command gh secret set VITE_SUPABASE_URL --body "https://<project-ref>.supabase.co"
command gh secret set VITE_SUPABASE_ANON_KEY --body "<anon-key>"
command gh secret set SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"
```

Verify names: `command gh secret list`

Re-run deploy: Actions → **Deploy to Cloudflare Pages** → Re-run, or:

```bash
command gh run rerun --workflow deploy.yml
```

Invoke the CLI as `command gh` to bypass interactive shell aliases — see `code/ci/pr/SKILL.md` `## GitHub CLI in agent shells`.

## After rotation checklist

1. Supabase secrets updated + edge functions redeployed (if R2 / ALLOWED_ORIGINS changed)
2. GitHub `ALLOWED_ORIGINS` matches Supabase `ALLOWED_ORIGINS` (same preview URL, no localhost)
3. R2 bucket CORS updated if origins changed (dashboard or `npm run infra:apply-r2-cors`)
4. Re-run **Deploy to Cloudflare Pages** workflow

## Common mistakes

- Updating Supabase `ALLOWED_ORIGINS` but not GitHub → smoke tests still send wrong `Origin` (403)
- Using R2 **Token value** in Supabase instead of **Access Key ID + Secret Access Key**
- Using **User** R2 token for production Supabase (breaks if user leaves org)
- **Object Read & Write** for runtime; **Admin Read & Write** only for CORS/infra tooling

## References

- [Secrets map](./references/secrets-map.md) — full table of every secret
- [Localhost and ALLOWED_ORIGINS](../supabase/references/localhost-origins.md)
- [Edge function workflow](../supabase/references/edge-function-workflow.md)
