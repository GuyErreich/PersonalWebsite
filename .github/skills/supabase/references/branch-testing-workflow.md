# Temporary Branch Testing Workflow

Use this workflow when you need to test the app from localhost without loosening production CORS.

## When to use
- You need a short-lived Supabase environment for local testing.
- You want localhost origins allowed only in the temporary branch.
- You want to keep production settings strict.

## Required outcome
- Temporary branch project exists.
- Branch-only CORS allows localhost.
- App points at the branch project only while testing.
- Temporary branch is deleted after validation.

## MCP-first flow
1. Confirm the parent project and that the branch is temporary.
2. Create the branch project with Supabase branch tools.
3. Verify branch status and project details.
4. Set branch secrets/config, including localhost-only CORS.
5. Apply the needed migrations or deploy edge functions to the branch.
6. Validate behavior from localhost.
7. Re-run security/performance advisors if the branch changed schema or runtime logic.
8. Delete the branch when done.

## CLI fallback flow
Use the Supabase CLI if MCP branch coverage is missing.

1. Create the branch with the Supabase CLI branch commands.
2. Set the branch-specific secrets with the CLI.
3. Point local environment variables at the branch project URL and anon key.
4. Run the app locally and verify the workflow.
5. Delete the branch when testing is finished.

## Localhost-only CORS guidance
Use a temporary branch secret for localhost origins instead of adding localhost to production.
Use the canonical value from [Localhost Origins Source](./localhost-origins.md).

## Cleanup checklist
- Remove branch-only secrets.
- Delete the temporary branch.
- Confirm production CORS remains unchanged.
- Re-run a quick validation pass if schema or runtime code changed.