# Temporary Branch Testing Workflow

Use this workflow when you need an isolated Supabase environment without changing production secrets.

## When to use
- You need a short-lived Supabase environment for integration testing.
- You want preview-only origins in `ALLOWED_ORIGINS`, separate from production.
- You want to keep production settings strict.

## Required outcome
- Temporary branch project exists.
- Branch `ALLOWED_ORIGINS` lists deployed preview URLs only (no localhost — see [Localhost and ALLOWED_ORIGINS](./localhost-origins.md)).
- App points at the branch project only while testing.
- Temporary branch is deleted after validation.

## MCP-first flow
1. Confirm the parent project and that the branch is temporary.
2. Create the branch project with Supabase branch tools.
3. Verify branch status and project details.
4. Set branch secrets/config with preview URLs in `ALLOWED_ORIGINS`.
5. Apply the needed migrations or deploy edge functions to the branch.
6. Validate behavior from the deployed preview origin.
7. Re-run security/performance advisors if the branch changed schema or runtime logic.
8. Delete the branch when done.

## CLI fallback flow
Use the Supabase CLI if MCP branch coverage is missing.

1. Create the branch with the Supabase CLI branch commands.
2. Set the branch-specific secrets with the CLI.
3. Point environment variables at the branch project URL and anon key.
4. Deploy or open the app on a preview URL and verify the workflow.
5. Delete the branch when testing is finished.

## ALLOWED_ORIGINS guidance
Use preview deployment URLs on the branch secret — never localhost or loopback. See [Localhost and ALLOWED_ORIGINS](./localhost-origins.md).

## Cleanup checklist
- Remove branch-only secrets.
- Delete the temporary branch.
- Confirm production ALLOWED_ORIGINS and R2 CORS remain unchanged.
- Re-run a quick validation pass if schema or runtime code changed.
