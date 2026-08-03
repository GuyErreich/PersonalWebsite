---
name: ci-pr-review-loop
description: Autonomous PR review-fix loop — alternates a fresh reviewer subagent and a pr-resolver fixer subagent on the branch's open PR until findings reach zero, within a round and cost budget, escalating only when a real design/policy call is required. Extends engineering.
disable-model-invocation: true
---

# CI — PR Review Loop

Self-hosted Bugbot replacement. Each round is a **full reviewer redo** of the PR, then a **developer fixer** that resolves approved findings properly — repeat until a full review finds zero issues (within budget / stop conditions). Reuses `code/review/reviewer` and `code/review/pr-resolver`; this skill only orchestrates, budgets, and reports.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Scoped consent

Invoking this skill (or an explicit "run the PR review loop" request) grants scoped commit and push consent for approved fix commits on the current PR branch only — same shape as pr-resolver scoped consent. Force-push and pushes to `dev`/`main` remain forbidden.

## Loop

```
preflight (models + cold budget gate — stop here if over cap)
  → Round N: pr-reviewer focus=full (fresh full-branch review)
  → post inline comments only when there are new open findings (never “all clear” / Review passed on the PR)
  → fetch pre-existing unresolved threads (after review)
  → triage via references/triage-policy.md
  → escalate → pause and alert user
  → auto-approved → pr-fixer (root-cause fix, validate, commit, push, reply)
  → stop if full review was clean; else Round N+1 (another full review)
  → canvas summary
```

Success stop: **`clean_passes_required` consecutive** full reviews with zero open findings (default 2). One clean pass is not enough.

## Review first — never resolve before reviewing

Hard rules, not defaults:

1. **Round 1 is always a review pass.** Even when the PR already has Copilot or human comments, do not open by resolving them.
2. **Fetch pre-existing unresolved threads only after the round-1 review completes.** Merge them into that round's triage table tagged `loop` vs `external`.
3. **Never launch `pr-fixer` with an empty findings set.** Zero findings on round 1 → go straight to the canvas.
4. **`review-lock.py check pr` cannot satisfy round 1.** It may skip a duplicate scan of an unchanged tree later, but round 1 always runs the reviewer for real.

## Preflight

1. Resolve the open PR for the checked-out branch (`gh pr view` or GitHub MCP). No open PR → stop and report.
2. Preflight `gh auth status`; on failure fall back to GitHub MCP tools (see reviewer `references/pr-comments.md`).
3. Detect toolchain mode (`uv` / `python3 fallback` / `hooks degraded`) via `.cursor/hooks/run-python.sh --detect` and print it. Hook regressions: `npm run test:py`.
4. Bootstrap pricing: if `.cursor/review-loop/pricing.json` is missing or lacks a `modes` table, copy from `assets/pricing.default.json` and print its `updated` date for verification.
5. Resolve **role models** (default both **`inherit`** = Cursor Auto / parent — cheap):
   - `reviewer_model` — Task `model` for `pr-reviewer`
   - `fixer_model` — Task `model` for `pr-fixer`
   - Aliases: `auto`/`inherit` → `inherit`; `opus`/`opus-5` → `claude-opus-5-thinking-high`; `sonnet`/`sonnet-5` → `claude-sonnet-5-thinking-high`; see `references/loop-state.md`
   - Overrides: `review with opus, fix with auto` / `reviewer_model=opus fixer_model=auto`
6. Detect **pricing mode** for *loop caps* (`auto` vs `api`):
   - Default **`auto`** always (cheap caps). Do **not** flip the whole loop to `api` just because a role uses a named model.
   - Use **`api`** caps only when the user explicitly says so (`pricing api`).
   - Named-model *segments* still estimate at api-ish rates for honesty (hooks do this per transcript).
7. Initialize state via **`.cursor/hooks/run-python.sh review_loop_init.py`** (stdin JSON with `pr_number`, `pr_url`, `branch`, `toolchain_mode`, `pricing_updated`, optional `overrides`). This loads durable `.cursor/review-loop/preferences.json` — **do not hand-write `max_rounds: 3`**. Invocation overrides (`max 2 rounds`, `budget $1.50`, **`budget-only` → `overrides.max_rounds: null`**, **`manage high` → `overrides.manage_severity: "high"`**) are merged into preferences and the new `state.json`. Missing preference keys default once; explicit `null` for unlimited rounds is preserved across runs.
8. **Cold budget gate (required before any round):** project the first subagent (reviewer) with `cold_projection` / mode defaults. If `projected > max_tokens_est` or `projected > max_usd_est` (with spent=0), **do not set `active: true`**, do not launch Task — escalate with spent/projected/cap and stop.
9. Set `active: true` on the state from init (or re-save). Print: `pricing_mode`, `reviewer_model`, `fixer_model`, `manage_severity`, `max_rounds` (`unlimited` when null), `max_tokens_est`, `max_usd_est`, and the cold projection.

## Per-round protocol

1. Stamp `started_at` / `reviewer_started_at` for the upcoming subagent in `state.json`. Set `next_model` to `reviewer_model`.
2. Launch **`pr-reviewer`** via Task:
   - `subagent_type: pr-reviewer`
   - `run_in_background: true` (see launch contract)
   - `model: <reviewer_model>` (default `inherit`)
   - `focus`: invocation override if present (`delta` / `confirm`), otherwise **`full` every round** — do not infer `delta` from round number.
   - Fresh context every round. Pass: PR number/URL, round number, focus, **`closed_findings`**, `accepted_by_design`, **`fix_hotspots`** (unique paths from closed/fixed this run), and **`consecutive_clean_passes`**. Do **not** pass prior fixer reasoning. Tell the reviewer explicitly when this is a post-fixer or second-clean pass so it stays adversarial.
3. **Always** tell the user (verbatim or equivalent): *Subagent panel may stay blank — I'll continue when the review finishes.* Do **not** cancel because the panel shows Loading Chat / Waiting for subagent. Wait for the Task completion notification, then collect the findings table + stable signatures.
4. **Closed-finding filter (required):** before triage or inline comments, drop any row whose signature is in `closed_findings`, or that restates the same closed defect at the same path. Still keep *different* issues in those files. Recurrence (`Source: recurrence`, defect still present) → escalate once — do not treat as a fresh auto-fix. Post to GitHub **only** for **new open** signatures. **Never** post clean-pass / “Review passed” / “0 findings” reviews, Verdict/Lint checklists, or “intended event” footnotes — those contaminate PR comment context.
5. After the review (and only then): fetch unresolved threads; merge tagged `external`.
6. Triage via `references/triage-policy.md` (severity floor → defer; unambiguous must-fix even at High/Critical → auto-fix; escalate **only** for design/policy ambiguity). Escalations → pause, alert, set `escalation_pending`, wait.
7. If auto-approved rows remain: stamp `fixer_started_at`, set `next_model` to `fixer_model`, launch **`pr-fixer`** (`subagent_type: pr-fixer`, `run_in_background: true`, `model: <fixer_model>`). **Again** alert: *Subagent panel may stay blank — I'll continue when the fixer finishes.* Hand only those rows. Fixer skips pr-resolver's Plan-mode gate.
8. Record round outcome into `state.json`. Append every **fixed**, **accepted**, and **deferred** (below `manage_severity`) finding to `closed_findings` (and to `accepted_by_design` when by design). Cost estimate + fingerprint go on the round entry.
9. **Before the next round:** re-check projective budget (spent + projected next). If over cap → escalate; do not launch. The `subagentStart` hook enforces the same deny.
10. Evaluate stop conditions (`consecutive_clean_passes` vs `clean_passes_required`, budget, escalation). If continuing, launch the next review round — **including after a single clean pass**.

### Subagent launch contract (required)

- Always **`run_in_background: true`**. Custom-agent panels often show only **Loading Chat** until the Task finishes (no live stream) — that is expected.
- **Every** reviewer/fixer launch: alert the user that the subagent panel may stay blank and you will continue when it finishes. Do **not** mention a progress log file.
- After launch: do **not** cancel because of Loading Chat / Waiting for subagent. Rely on the Task completion notification. Do **not** vacously `AwaitShell`-poll the Task tool.
- Never nest Task/subagents inside `pr-reviewer` / `pr-fixer` (unsupported; hangs the parent).
- If a custom type fails to start twice, fall back once to `generalPurpose` with the same prompt body, still `run_in_background: true`, same `model`. **Note:** hooks only match `pr-reviewer|pr-fixer` — on a `generalPurpose` fallback, re-check the projective budget in the orchestrator before launch (hooks will not gate it).
- Pass the role model on every Task call — do not hard-code `inherit` when state says otherwise.

### Validate is hard (required)

- Subagents must run **raw** `npm run lint` / `npm run build` (or the repo `AGENT.md` commands) and treat **non-zero exit as fail**.
- Do **not** trust `rtk`-wrapped exit codes for pass/fail.
- `lint: fail` or `build: fail` → stop fixing/committing; surface as a finding or escalation. Never record `lint: pass` when the command failed.

## Stop conditions

Keep looping (unlimited / budget-only when `max_rounds` is null) until one of:

- **Confirmed clean (success):** `consecutive_clean_passes >= clean_passes_required` (default **2**). A single clean full review is **not** enough — reviewers miss issues; after the first zero-open-findings pass, immediately launch another full `pr-reviewer`. Only write the success canvas after the required consecutive cleans.
- Projected next-round spend would cross `max_tokens_est` or `max_usd_est` (preflight, between rounds, and `subagentStart` hook)
- Round cap hit (skipped when `max_rounds` is unlimited / budget-only)
- Escalation pending (until user responds)
- Lint or build failed and was not fixed in-round

**Do not stop as “passed” when:**

- Only one clean review landed (bump `consecutive_clean_passes` and continue)
- Open findings remain with no *new* signatures (escalate recurrence — fix did not stick)
- Unchanged fingerprint alone (not a success signal; after a no-op fix, escalate)
- Hook `followup_message` says “continue” / “reviewer finished” — obey the skill, do not invent an early canvas

### After each reviewer report (orchestrator)

1. Write findings / new_signatures / fingerprint / coverage into the round entry **before** evaluating stops.
2. Apply the closed-finding filter.
3. If open findings remain → `consecutive_clean_passes = 0`, triage, fixer as usual.
4. If zero open findings **but** coverage gate failed (`N < M` or phases incomplete) → treat as **not clean** (`consecutive_clean_passes = 0`); launch another full review (or escalate if the reviewer cannot cover the surface).
5. If zero open findings **and** coverage gate passed → `consecutive_clean_passes += 1`. If still below `clean_passes_required`, launch another full adversarial review. If at requirement → canvas + `active: false`.
## Escalation format

Do **not** ask the user “what is by design?” — propose it. For every escalated finding, always include **(1) why it is an issue** and **(2) a category**.

```markdown
## PR Review Loop — Escalation

**Round:** N
**Blocked auto-fix because:** <design/policy ambiguity — never “because severity is High”>

**Recommendations** (orchestrator proposes; user confirms or corrects):

| # | Location | Severity | Category | Recommend | Why this is an issue | If fixing / By-design evidence |
|---|---|---|---|---|---|---|
| 1 | path:line | High | security | Fix | <user/system harm if left> | <minimal fix shape> |
| 2 | path:line | Medium | logic | By design | <why it looks intentional — or residual risk if accepting> | <product intent evidence> |

**Spent / cap:** ≈N tok / $X · cap …

**Reply with:** confirm all · fix #… · accept #… as by design · stop
```

### Category (required, pick one)

| Category | Use when |
|---|---|
| `security` | Auth, secrets, RLS, injection, data exposure, privilege |
| `logic` | Wrong behavior, state bugs, race, incorrect contract |
| `performance` | Hot paths, N+1, unbounded work, render/jank cost |
| `best-practices` | Architecture, surprising UX, maintainability, a11y patterns |
| `code-style` | Naming, formatting, local conventions (rare to escalate) |

Rules:

- **Why this is an issue** = concrete harm or surprise if left (not “because severity is High”).
- Every escalated row gets **Category**, **Recommend: Fix | By design**, and **Why this is an issue** written by you.
- Never leave “accept by design (with rationale)” as an empty homework prompt.
- If evidence for by-design is weak, recommend **Fix** (or say uncertainty in Why) — do not dump the rationale burden on the user.

## Closing canvas

Read `state.json` and write the canvas per `references/summary-canvas.md`. Set `active: false`.

## Additional resources

- [triage-policy.md](references/triage-policy.md) — auto-fix vs escalate matrix
- [loop-state.md](references/loop-state.md) — state schema, budget, models, round focus, closed findings
- [summary-canvas.md](references/summary-canvas.md) — canvas sections and data contract

## Closed findings (do not re-poop)

Once fixed, accepted, or deferred (below severity floor), a finding's signature goes into `closed_findings`. Every later **full** review still scans those areas for **other** issues, but the same closed issue must not reappear in triage, fixer handoff, or new inline comments. True fix regressions use `Source: recurrence` and escalate once.