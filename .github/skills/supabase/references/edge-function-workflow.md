# Edge Function Workflow

Load this only when the task edits or deploys Supabase Edge Functions.

## Checklist
1. Confirm target project and branch.
2. Inspect existing function behavior first.
3. Apply minimal code change.
4. Deploy function to the intended target.
5. Validate invocation result and error handling.
6. Run advisors if runtime/security posture changed.
7. Report endpoint, validation evidence, and residual risk.

## Rules
- Prefer MCP tools first.
- Use CLI fallback only when MCP coverage is missing.
- Keep production and temporary branch settings clearly separated.
