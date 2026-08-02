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
- A finding that **recurs after a fix** (`Source: recurrence`, same closed signature / same defect still present) — escalate once; do not re-open as a fresh auto-fix loop
- Lint or build failing after a fix (non-zero exit from raw `AGENT.md` validate commands)
- Infrastructure failures: no open PR, push rejection, merge conflict
- Projected next-round spend would cross `max_tokens_est` or `max_usd_est`

Tag these `Decision: Escalate`. Set `escalation_pending: true` in `state.json`. The budget hook refuses new subagents until cleared.

### Escalation must propose — never blank-ask “by design”

When escalating, the orchestrator **tells** the user what looks intentional vs what should change. Do **not** ask the user to invent a by-design rationale.

For every escalated finding, include:

1. **Why this is an issue** — concrete harm or surprising behavior if left as-is.
2. **Category** — exactly one of: `security` | `logic` | `performance` | `best-practices` | `code-style`.
3. **Recommend** — Fix or By design, with fix shape or by-design evidence.

| Recommend | When |
|---|---|
| **Fix** | Clear bug / security gap / inconsistent behavior relative to stated product rules |
| **By design** | Evidence in the PR, UI copy, comments, migrations, or prior accepted items that this is intentional |

| Category | Use when |
|---|---|
| `security` | Auth, secrets, RLS, injection, data exposure, privilege |
| `logic` | Wrong behavior, state bugs, race, incorrect contract |
| `performance` | Hot paths, N+1, unbounded work, render/jank cost |
| `best-practices` | Architecture, surprising UX, maintainability, a11y patterns |
| `code-style` | Naming, formatting, local conventions (rare to escalate) |

For each **By design** recommendation, write the rationale yourself (1–3 sentences): what product rule it matches, where you saw that intent, and why auto-fix would be wrong. For each **Fix** recommendation, state the minimal fix shape.

The user only **confirms, corrects, or stops** — they should not have to invent the “why.”

## Closed findings (fixed or accepted)

Anything already in `state.closed_findings` is **done for this loop run**.

- **Still scan** those files/areas on later full reviews — look for *other* issues.
- **Do not** re-triage, re-fix, or re-comment the same closed issue (same signature, or same path + same underlying defect restated).
- Drop accidental re-reports in the orchestrator before the triage table.
- True regressions only via `Source: recurrence` → Escalate (above).

## By design (keep)

Intentional trade-offs, false positives, stylistic preferences already accepted, or out-of-scope suggestions. Tag `Decision: By design` with a one-line (or short) rationale **written by the orchestrator**. Add to `accepted_by_design` **and** `closed_findings` (`status: "accepted"`) so later rounds do not re-poop them.

When the orchestrator can classify by design **without** needing a security/product call, do that in the triage table immediately — do not escalate just to ask for a rationale.

After a successful fix, append the finding to `closed_findings` with `status: "fixed"`.

## External threads

Pre-existing Copilot or human threads (origin `external`) go through the same matrix. They are never acted on before the round-1 review finishes.

## Triage table shape

```markdown
| # | Origin | Location | Severity | Category | Finding | Decision | Rationale |
|---|---|---|---|---|---|---|---|
| 1 | loop | path:line | Medium | logic | ... | Fix | ... |
| 2 | external | path:line | Low | code-style | ... | By design | intentional ... |
| 3 | loop | path:line | High | security | ... | Escalate → recommend Fix | why it's an issue … |
| 4 | loop | path:line | High | best-practices | ... | Escalate → recommend By design | <orchestrator-written why> |
```
