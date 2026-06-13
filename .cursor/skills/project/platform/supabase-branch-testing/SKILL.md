---
name: supabase-branch-testing
description: Creates temporary Supabase branch environments for localhost testing without relaxing production CORS. Use when validating schema or auth changes against a branch before merge.
disable-model-invocation: true
---

# Supabase Branch Testing Router Skill

This skill is intentionally thin. It routes to one reference at a time and stops loading context when enough signal exists.

## Outcome
- Create and use a temporary branch safely.
- Keep localhost CORS branch-only.
- Validate the requested flow.
- Clean up branch resources.

## Load Order (Lazy)
1. Confirm project and branch-testing intent.
2. Load [Temporary Branch Testing Workflow](../supabase/references/branch-testing-workflow.md).
3. Load [Localhost Origins Source](../supabase/references/localhost-origins.md) only when setting CORS secrets.
4. Load one deeper workflow only if needed:
- [Schema Change Workflow](../supabase/references/schema-change-workflow.md)
- [Edge Function Workflow](../supabase/references/edge-function-workflow.md)
- [Advisor Workflow](../supabase/references/advisor-workflow.md)
5. Stop after validation and cleanup are complete.

## Branching Logic
1. Branch lifecycle only:
- Create branch, set secrets, test, cleanup.
2. Branch plus schema work:
- Load schema workflow in addition to branch workflow.
3. Branch plus edge function work:
- Load edge-function workflow in addition to branch workflow.
4. Branch plus risk verification:
- Load advisor workflow after branch changes.

## Rules
- Prefer MCP branch/project tools first.
- Use CLI fallback only if MCP coverage is missing.
- Never relax production CORS for localhost testing.
- Do not preload schema/function/advisor docs unless task requires them.

## Stop Conditions
- Stop after scope confirmation if user asked only planning questions.
- Stop after one requested test workflow passes and report is delivered.
- Stop after cleanup if branch was temporary.

## Response Contract
Return:
1. Scope chosen.
2. References loaded.
3. Actions executed.
4. Validation evidence.
5. Cleanup status.
