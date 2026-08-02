# Loop State

Runtime files under `.cursor/review-loop/` (gitignored):

| File | Role |
|---|---|
| `state.json` | This run’s ledger (rounds, costs, active flag) — reset each loop start |
| `preferences.json` | **Durable** caps/models across runs — never reset to factory on preflight |
| `pricing.json` | Local pricing table (bootstrapped from the skill asset) |

## Preferences (durable)

```json
{
  "max_rounds": null,
  "max_tokens_est": 1000000,
  "max_usd_est": 2.0,
  "pricing_mode": "auto",
  "reviewer_model": "inherit",
  "fixer_model": "inherit",
  "clean_passes_required": 2
}
```

Preflight **must** call `review_loop_init.py` (or `start_loop_state`) so a prior `max_rounds: null` (budget-only) is not overwritten with `3`. Only missing keys take factory defaults; invocation `overrides` update both preferences and the new state.

## State schema (per run)

```json
{
  "active": false,
  "pr_number": 0,
  "pr_url": "",
  "branch": "",
  "started_at": "",
  "pricing_mode": "auto",
  "reviewer_model": "inherit",
  "fixer_model": "inherit",
  "next_model": "inherit",
  "max_rounds": 3,
  "max_tokens_est": 1000000,
  "max_usd_est": 2.0,
  "clean_passes_required": 2,
  "round": 0,
  "escalation_pending": false,
  "toolchain_mode": "uv",
  "pricing_updated": "",
  "last_fingerprint": "",
  "accepted_by_design": [],
  "closed_findings": [],
  "consecutive_clean_passes": 0,
  "escalations": [],
  "rounds": [],
  "totals": {
    "tokens_est": 0,
    "usd_est": 0,
    "turns": 0,
    "tool_calls": 0,
    "wall_clock_s": 0
  }
}
```

### Role models

| Field | Default | Purpose |
|---|---|---|
| `reviewer_model` | `inherit` | Task `model` for every `pr-reviewer` launch |
| `fixer_model` | `inherit` | Task `model` for every `pr-fixer` launch |
| `next_model` | (set before launch) | Hint for the budget hook's cold/projection path |

`inherit` / `auto` follow the parent chat (Cursor Auto when the parent is on Auto) — **cheap by default**. Named frontier slugs cost more; estimate those segments at api-ish rates without flipping loop caps to `api` unless the user asks.

#### Aliases (user phrase → Task slug)

| Phrase | Task `model` |
|---|---|
| `auto`, `inherit`, `composer` | `inherit` |
| `opus`, `opus-5` | `claude-opus-5-thinking-high` |
| `sonnet`, `sonnet-5` | `claude-sonnet-5-thinking-high` |
| `fast` | `composer-2.5-fast` |
| exact Task slug | passed through when recognized |

Override examples: `review with opus, fix with auto` · `reviewer_model=opus fixer_model=inherit`.

`pricing_mode` (loop **caps** only):

| Mode | When | Effect |
|---|---|---|
| `auto` (default) | Always, unless user says otherwise | Cheap $/MTok table for Auto segments; defaults `max_tokens_est=1_000_000`, `max_usd_est=2` |
| `api` | User override only (`pricing api`) | API-like list rates for caps; defaults `max_tokens_est=400_000`, `max_usd_est=3` |

Token estimates are mode-invariant (same transcript math). Dollar estimates for a **named** reviewer/fixer segment use api-ish rates even when `pricing_mode` stays `auto`, so projective checks stay honest without defaulting everyone into expensive caps.

### Round entry

```json
{
  "n": 1,
  "focus": "full",
  "started_at": "",
  "reviewer_started_at": "",
  "fixer_started_at": "",
  "findings": [],
  "new_signatures": [],
  "fixed": [],
  "accepted": [],
  "escalated": [],
  "commit_shas": [],
  "lint": "pass|fail|skip",
  "build": "pass|fail|skip",
  "fingerprint": "",
  "cost": {
    "tokens_in_est": 0,
    "tokens_out_est": 0,
    "tokens_est": 0,
    "usd_est": 0,
    "turns": 0,
    "tool_calls": 0,
    "wall_clock_s": 0,
    "model": "",
    "assumptions": ""
  }
}
```

### Finding signature

Stable id for dedup across rounds: `sha256(path + "|" + normalized_finding_text)[:16]`. Store on each finding as `signature`.

### Closed findings (do not re-poop)

Every finding that was **fixed** or **accepted by design** is appended here for the rest of the run. Later full reviews still **scan** those files/areas for *other* issues, but must not re-report the same closed issue.

```json
{
  "signature": "...",
  "location": "path:line",
  "finding": "...",
  "status": "fixed|accepted",
  "closed_in_round": 2,
  "rationale": "optional — required when status is accepted"
}
```

Orchestrator rules:

1. After each fix or by-design decision, append the finding to `closed_findings` (and to `accepted_by_design` when status is `accepted`).
2. Pass the full `closed_findings` list into every `pr-reviewer` launch.
3. Before triage, drop any returned row whose `signature` is already in `closed_findings` (or is clearly the same underlying defect at the same path with restated wording). Do not hand those to the fixer or re-post as new inline comments.
4. Exception — **recurrence**: the reviewer tagged `Source: recurrence` and the defect is still present after a fix → escalate once (do not auto-fix in a loop). Do not treat restated closed issues as fresh findings.

### Accepted-by-design entry

```json
{ "signature": "...", "location": "path:line", "finding": "...", "rationale": "..." }
```

`accepted_by_design` remains the rationale store for by-design keeps; those signatures also appear in `closed_findings` with `status: "accepted"`.

## Defaults and overrides

| Cap / field | Default (`auto`) | Default (`api` caps) | Override example |
|---|---|---|---|
| `pricing_mode` | `auto` | `api` | "pricing api" / "use Auto rates" |
| `reviewer_model` | `inherit` | `inherit` | "review with opus" |
| `fixer_model` | `inherit` | `inherit` | "fix with auto" |
| `max_rounds` | 3 | 3 | `"max 2 rounds"` · **budget-only / unlimited rounds:** `0`, `null`, `"none"`, `"unlimited"`, or `"budget-only"` |
| `max_tokens_est` | 1000000 | 400000 | "budget 200k tokens" |
| `max_usd_est` | 2.00 | 3.00 | "budget $1.50" |
| `clean_passes_required` | 2 | 2 | `"1 clean pass"` (faster, riskier) / `"3 clean passes"` |

When `max_rounds` is unlimited, stop conditions are **budget + consecutive clean reviews** — the loop may run round 4+ until projected spend would cross the token/USD caps, or until `consecutive_clean_passes >= clean_passes_required`. Do **not** stop on a single clean review, “no new signatures”, or fingerprint alone.

## Round focus (reviewer → developer until zero)

Each round is the same cycle: **full reviewer pass** → triage → **developer fixer** (when needed) → next full review. Success is **`clean_passes_required` consecutive** full reviews with zero **open** findings (default 2). Later rounds still scan previously flagged areas for *other* issues — they must not re-report the same closed finding.

| When | Focus | Scope |
|---|---|---|
| Every round by default | `full` | From-scratch full-branch review — all reviewer phases across `merge-base...HEAD`. Round number does **not** shrink scope. |
| After a clean pass but below `clean_passes_required` | `full` | Another full review immediately — this is the confirm gate, not an early exit. |
| User says `focus delta` / “cheap delta pass” | `delta` | Opt-in only: fixer diff + previously flagged files. Never the default for round 2+. |
| User says `confirm` | `confirm` | Opt-in label only; default success gate uses repeated `full` reviews. |

Orchestrator rule: `focus = invocation override if present else "full"`.
## Projective budget check

Alert **before** spending — never start a loop/round that is already projected over cap.

### Preflight (before `active: true` / before round 1)

1. Resolve caps and role models.
2. Cold-project the first reviewer launch (`cold_projection` / mode defaults; named `reviewer_model` raises USD projection).
3. If projected tokens or USD exceed caps → escalate (spent=0 / projected / cap) and **stop**. Do not set `active` or launch Task.

### Before every subagent when `active` (orchestrator + `subagentStart` hook)

1. If `escalation_pending` → deny.
2. If `max_rounds` is set (not unlimited) and `round > max_rounds` → deny (the final allowed round, `round == max_rounds`, must still run — including its fixer). Unlimited / budget-only: skip this check.
3. Projected next cost = max(last round cost, running average of round costs), or cold projection when no rounds yet. If `totals + projected` crosses `max_tokens_est` or `max_usd_est` → deny and escalate with spent / projected / cap.
4. Unchanged fingerprint does **not** block `pr-reviewer` (re-scan for false cleans / recurrence). Unchanged fingerprint after a fix **does** block another `pr-fixer` — escalate instead.

In degraded toolchain mode the orchestrator applies the same checks from `state.json` itself.

## Hook scoping

`subagentStart` / `subagentStop` are registered globally but filtered:

1. **hooks.json `matcher`:** `pr-reviewer|pr-fixer` — Cursor never invokes the scripts for `explore`, `shell`, `generalPurpose`, etc.
2. **In-code guard:** even if the matcher is missing, scripts no-op unless `subagent_type` is a loop agent **and** `state.active` is true.
3. **Git guard** (`beforeShellExecution`) uses `matcher: git` and still only enforces when `active: true` (scoped consent / no force-push to protected branches during a loop).

## Fingerprint

```bash
python3 scripts/review-lock.py fingerprint pr --json
```

Store the `fingerprint` field on each round and as `last_fingerprint`.
