# Supabase MCP Playbook

Use this reference when the main skill needs concrete tool sequences.

## 1. Project Discovery and Selection
1. List projects.
2. Match by user-provided project name/ref.
3. Fetch project details to verify status before changes.

## 2. Safe Debug Workflow
1. Start with advisors:
- security advisors
- performance advisors
2. If issue is data-related, run narrow SQL reads first.
3. Only after root-cause confidence, propose or apply a change.

## 3. Schema Change Workflow
1. Prefer migration path for DDL.
2. Keep one logical change per migration.
3. Validate schema and impacted queries after applying.
4. Re-run advisors.

## 4. Data Operation Workflow
1. Use explicit, bounded queries.
2. Validate affected rows and edge cases.
3. Avoid large updates/deletes without clear predicates.

## 5. Edge Function Workflow
1. List and inspect existing function.
2. Edit with least-privilege assumptions.
3. Deploy function.
4. Verify expected behavior and error handling.

## 6. Branch and Cost-Aware Workflow
1. Confirm org/project target.
2. Confirm cost implications when creating projects/branches.
3. Create branch for risky changes.
4. Rebase/merge only after validation is complete.

## 7. Type and Client Contract Workflow
1. Generate TypeScript types when schema changes.
2. Update client-side assumptions that depend on schema.
3. Rebuild and validate app behavior.
