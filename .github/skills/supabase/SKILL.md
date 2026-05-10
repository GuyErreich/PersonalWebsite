---
name: supabase
description: "Use when: working with Supabase via MCP tools, planning schema changes, debugging Auth/Storage/Database issues, validating security/performance advisors, creating projects/branches, deploying edge functions, or generating TypeScript types. Triggers on Supabase, Postgres, migration, RLS, MCP, edge function, branch, advisor, SQL."
argument-hint: "What Supabase task should this skill handle?"
---

# Supabase MCP Workflow

Use this skill when the task touches Supabase and you want deterministic, context-aware execution with MCP tools.

## Outcomes
- Pick the correct Supabase project and branch safely.
- Run the smallest safe operation first (inspect before mutate).
- Apply schema/data/runtime changes with clear validation gates.
- Finish with security/performance advisor checks and concrete next actions.

## Smart Context Loading
Load context in this order and stop when you have enough signal:
1. Read user intent and classify: inspect, debug, change schema, query data, or deploy runtime.
2. Load project state first: list projects, select target project, then verify project status.
3. Load only task-specific references:
   - [MCP Playbook](./references/mcp-playbook.md)
   - [Execution Checklists](./references/execution-checklists.md)

## Decision Flow
1. Is this a read-only request?
- Yes: use read/query MCP calls only and report findings.
- No: continue.
2. Does this change schema (tables, columns, constraints, indexes, policies)?
- Yes: use migration workflow (never ad-hoc DDL in direct SQL).
- No: continue.
3. Is this runtime logic work (Edge Functions)?
- Yes: inspect function, update code, deploy, then validate.
- No: continue.
4. Is this environment/project setup?
- Yes: org/project/branch flow with explicit cost confirmation.

## Core Procedure
1. Confirm target scope:
- Project ref/id
- Branch (main vs dev branch)
- Environment intent (dev/staging/prod)
2. Baseline snapshot:
- List projects and verify the active one.
- Fetch project details and current status.
- Pull advisors (security + performance) for baseline risk visibility.
3. Execute minimal operation:
- Read-only tasks: use targeted SQL or metadata calls only.
- Schema tasks: prepare migration, apply once, verify shape/data.
- Data tasks: run parameter-safe SQL and verify row impact.
- Runtime tasks: inspect/deploy edge function and check behavior.
4. Validate:
- Re-run relevant reads.
- Re-run advisors for regressions.
- Summarize what changed, what was verified, and residual risk.

## Temporary Branch Testing Workflow
Use this when you want to test from localhost without weakening production CORS.

### Goal
- Create a temporary Supabase branch environment.
- Allow localhost origins only in that branch.
- Keep production origins strict.
- Delete the branch after testing.

### Preferred sequence
1. Confirm the parent project and the temporary branch purpose.
2. Use MCP to create a branch project for testing.
3. Set branch-only secrets/config:
- `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`
- Any other branch-specific secrets needed for the test.
4. Apply migrations or deploy edge functions to the branch only.
5. Run the app against the branch project from localhost.
6. Validate the upload/auth/CORS path and re-run advisors if the branch changes schema or runtime behavior.
7. Remove the temporary branch when testing is complete.

### MCP first, CLI fallback second
- Prefer MCP branch/project tools when they are available.
- If MCP coverage is missing for a branch operation, use the Supabase CLI fallback with the smallest safe scope.
- Do not expand localhost CORS to production just to test locally.

### CLI fallback guidance
- Use the Supabase CLI branch/project commands to create, inspect, rebase/merge, and delete the temporary branch.
- Update branch secrets with the CLI before testing.
- Point the local frontend at the branch project URL and branch anon key only for the duration of the test.

### Cleanup requirements
- Revert any temporary localhost-only branch secrets after testing.
- Delete the temporary branch when finished.
- Re-run a quick validation after cleanup if the workflow touched schema or edge functions.

## Quality Gates
- Never run broad/destructive operations without explicit user confirmation.
- Prefer smallest reversible step over large combined changes.
- Always report: command/tool used, target project, validation result.
- For schema work, provide rollback strategy or compensating migration notes.

## MCP Rules
- Prefer MCP tools over guessed manual steps whenever equivalent coverage exists.
- If MCP coverage is missing, use CLI fallback with explicit justification and the smallest safe scope.
- For DDL, use migration-oriented MCP path instead of raw SQL.
- For direct SQL, avoid interpolating user input; keep queries explicit and scoped.
- Run advisors after structural changes.

## Response Contract
Always return:
1. Scope chosen (project/branch).
2. Actions executed (in order).
3. Validation evidence.
4. Open risks/assumptions.
5. Next best action.

## References
- [MCP Playbook](./references/mcp-playbook.md)
- [Execution Checklists](./references/execution-checklists.md)
- [Temporary Branch Testing Workflow](./references/branch-testing-workflow.md)
