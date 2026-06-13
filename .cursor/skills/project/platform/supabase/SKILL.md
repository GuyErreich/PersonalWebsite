---
name: supabase
description: Routes Supabase MCP workflows for schema changes, edge functions, advisors, and branch testing. Use when working with Supabase, Postgres migrations, RLS, MCP tools, or edge functions.
disable-model-invocation: true
---

# Supabase Skill Router

Use this skill as a thin router. It should classify intent, load one small reference, execute, and stop.

## Router Outcomes
- Correct project and branch selection.
- Minimal safe operation first.
- Only task-relevant reference loading.
- Clear stop conditions to prevent context growth.

## Load Order (Stop Early)
1. Classify task: inspect, schema, data, edge-function, advisor, or branch-testing.
2. Confirm scope: project and branch.
3. Load exactly one reference based on classification.
4. If unresolved, load one additional deeper reference.
5. Stop loading docs when action can proceed safely.

## Decision Tree
1. Read-only inspect/debug:
- Load [Execution Checklists](./references/execution-checklists.md) only.
2. Schema change:
- Load [Schema Change Workflow](./references/schema-change-workflow.md).
3. Data operation:
- Load [Execution Checklists](./references/execution-checklists.md) only.
4. Edge function change:
- Load [Edge Function Workflow](./references/edge-function-workflow.md).
5. Advisor-driven review:
- Load [Advisor Workflow](./references/advisor-workflow.md).
6. Temporary branch localhost testing:
- Load [Temporary Branch Testing Workflow](./references/branch-testing-workflow.md).
- For localhost origin values, load [Localhost Origins Source](./references/localhost-origins.md).

## Hard Rules
- Prefer MCP tools first, CLI only when MCP coverage is missing.
- Never apply localhost CORS to production settings.
- Never run ad-hoc DDL via raw SQL when migration flow applies.
- Never load unrelated references.

## Stop Conditions
- Stop after project and branch are confirmed if user only asked scope questions.
- Stop after one workflow completes and validation is reported.
- Do not pre-load branch, function, schema, and advisor docs together.

## Response Contract
Always return:
1. Scope selected.
2. Reference loaded.
3. Actions executed.
4. Validation result.
5. Next step (or completion).

## References
- [Execution Checklists](./references/execution-checklists.md)
- [Schema Change Workflow](./references/schema-change-workflow.md)
- [Edge Function Workflow](./references/edge-function-workflow.md)
- [Advisor Workflow](./references/advisor-workflow.md)
- [Temporary Branch Testing Workflow](./references/branch-testing-workflow.md)
- [Localhost Origins Source](./references/localhost-origins.md)
