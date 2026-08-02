# Triage Policy

Orchestrator classifies every finding (and every external unresolved thread) before the fixer runs. Policy-based — no Plan-mode gate per round unless something escalates.

## Auto-fix (no ask)

When the change stays inside files already in the PR diff:

- Lint, format, import order, and type errors
- Missing cleanup of listeners, timers, or Three.js disposal
- Missing a11y attributes or keyboard handlers on existing controls
- Magic values and naming violations already codified in `AGENT.md`
- Mechanical duplication extraction the `AGENT.md` mandatory-refactor rule already requires
- Doc and comment drift

Tag these `Decision: Fix` with a one-line rationale and hand them to `pr-fixer`.

## Escalate (pause and alert)

Stop the loop and ask the user when any of:

- Critical or High severity
- Auth, secrets, RLS, migrations, or env config
- Architectural refactors or changes to files outside the PR diff
- Public API, props contract, or user-visible behavior changes
- A finding that recurs after a fix attempt (fix did not stick)
- Lint or build failing after a fix
- Infrastructure failures: no open PR, push rejection, merge conflict
- Projected next-round spend would cross `max_tokens_est` or `max_usd_est`

Tag these `Decision: Escalate`. Set `escalation_pending: true` in `state.json`. The budget hook refuses new subagents until cleared.

## By design (keep)

Intentional trade-offs, false positives, stylistic preferences the user previously accepted, or out-of-scope suggestions. Tag `Decision: By design` with a one-line rationale. Add to `accepted_by_design` so later review rounds do not re-litigate them.

## External threads

Pre-existing Copilot or human threads (origin `external`) go through the same matrix. They are never acted on before the round-1 review finishes.

## Triage table shape

```markdown
| # | Origin | Location | Severity | Finding | Decision | Rationale |
|---|---|---|---|---|---|---|
| 1 | loop | path:line | Medium | ... | Fix | ... |
| 2 | external | path:line | Low | ... | By design | intentional ... |
| 3 | loop | path:line | High | ... | Escalate | needs human ... |
```
