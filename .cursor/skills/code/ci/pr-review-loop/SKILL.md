---
name: ci-pr-review-loop
description: Autonomous PR review-fix loop — alternates a fresh reviewer subagent and a pr-resolver fixer subagent on the branch's open PR until findings reach zero, within a round and cost budget, escalating risky findings. Extends engineering.
disable-model-invocation: true
---

# CI — PR Review Loop

Self-hosted Bugbot replacement. Runs against the branch's open PR: review first, then policy-triage, then fix — looping until zero findings or a stop condition. Reuses `code/review/reviewer` and `code/review/pr-resolver`; this skill only orchestrates, budgets, and reports.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Scoped consent

Invoking this skill (or an explicit "run the PR review loop" request) grants scoped commit and push consent for approved fix commits on the current PR branch only — same shape as pr-resolver scoped consent. Force-push and pushes to `dev`/`main` remain forbidden.

## Loop

```
preflight
  → Round N: pr-reviewer subagent (fresh) — ALWAYS FIRST
  → post inline comments on the PR
  → fetch pre-existing unresolved threads (after review)
  → triage via references/triage-policy.md
  → escalate → pause and alert user
  → auto-approved → pr-fixer subagent (fresh)
  → fix, validate, commit, push, reply
  → stop? → else Round N+1
  → canvas summary
```

## Review first — never resolve before reviewing

Hard rules, not defaults:

1. **Round 1 is always a review pass.** Even when the PR already has Copilot or human comments, do not open by resolving them.
2. **Fetch pre-existing unresolved threads only after the round-1 review completes.** Merge them into that round's triage table tagged `loop` vs `external`.
3. **Never launch `pr-fixer` with an empty findings set.** Zero findings on round 1 → go straight to the canvas.
4. **`review-lock.py check pr` cannot satisfy round 1.** It may skip a duplicate scan of an unchanged tree later, but round 1 always runs the reviewer for real.

## Preflight

1. Resolve the open PR for the checked-out branch (`gh pr view` or GitHub MCP). No open PR → stop and report.
2. Preflight `gh auth status`; on failure fall back to GitHub MCP tools (see reviewer `references/pr-comments.md`).
3. Detect toolchain mode (`uv` / `python3 fallback` / `hooks degraded`) via `.cursor/hooks/run-python.sh --detect` and print it.
4. Bootstrap pricing: if `.cursor/review-loop/pricing.json` is missing, copy from `assets/pricing.default.json` and print its `updated` date for verification.
5. Initialize `.cursor/review-loop/state.json` — see `references/loop-state.md`. Apply invocation overrides (`max 2 rounds`, `budget $1.50`).
6. Set `active: true`. Print caps: `max_rounds`, `max_tokens_est`, `max_usd_est`.

## Per-round protocol

1. Stamp `started_at` for the upcoming subagent in `state.json`.
2. Launch **`pr-reviewer`** (fresh context every round). Pass: PR number/URL, round number, round focus (see `references/loop-state.md`), accepted-by-design list. Do **not** pass prior fixer reasoning.
3. Collect the findings table + stable signatures. Post inline comments only for new signatures after round 1.
4. After the review (and only then): fetch unresolved threads; merge tagged `external`.
5. Triage via `references/triage-policy.md`. Escalations → pause, alert, set `escalation_pending`, wait.
6. If auto-approved rows remain: stamp `started_at`, launch **`pr-fixer`** with only those rows. Fixer skips pr-resolver's Plan-mode gate (orchestrator already triaged).
7. Record round outcome (findings, fixes, cost estimate, fingerprint) into `state.json`.
8. Evaluate stop conditions. If continuing, launch the next review round.

## Stop conditions

Halt when any of:

- Zero findings (or only accepted-by-design remain)
- No *new* finding signatures vs the previous round
- Unchanged `pr` fingerprint since last review (after round 1)
- Round cap hit
- Projected next-round spend would cross `max_tokens_est` or `max_usd_est`
- Escalation pending (until user responds)

## Escalation format

```markdown
## PR Review Loop — Escalation

**Round:** N
**Why:** <one sentence>
**Findings / numbers:** <spent, projected, cap | finding list>
**Options:** raise budget and continue | accept by design | fix manually | stop
```

## Closing canvas

Read `state.json` and write the canvas per `references/summary-canvas.md`. Set `active: false`.

## Additional resources

- [triage-policy.md](references/triage-policy.md) — auto-fix vs escalate matrix
- [loop-state.md](references/loop-state.md) — state schema, budget, round focus
- [summary-canvas.md](references/summary-canvas.md) — canvas sections and data contract
