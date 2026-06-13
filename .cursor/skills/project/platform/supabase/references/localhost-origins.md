# Localhost Origins Source

Use this file as the single source of truth for localhost origin allowlists.
Do not duplicate these values in other Supabase skill or prompt files.

## Canonical branch-only value

```text
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
```

## Rules
- Apply this value only to temporary development branches.
- Never apply this value to production settings.
- Update this file first if ports/origins change.
