# Schema Change Workflow

Load this only when the task changes tables, columns, constraints, indexes, triggers, or RLS.

## Checklist
1. Confirm target project and branch.
2. Capture baseline advisors.
3. Prepare one logical migration.
4. Apply migration once.
5. Validate schema shape and impacted queries.
6. Re-run advisors.
7. Report change, validation, and rollback note.

## Rules
- Use migration flow for DDL.
- Avoid raw ad-hoc DDL in direct SQL.
- Keep scope minimal and reversible.
