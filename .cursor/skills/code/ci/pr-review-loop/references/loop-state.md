# Loop State

Runtime ledger at `.cursor/review-loop/state.json` (gitignored). Budget source of truth and canvas data source.

## Schema

```json
{
  "active": false,
  "pr_number": 0,
  "pr_url": "",
  "branch": "",
  "started_at": "",
  "max_rounds": 3,
  "max_tokens_est": 400000,
  "max_usd_est": 3.0,
  "round": 0,
  "escalation_pending": false,
  "toolchain_mode": "uv",
  "pricing_updated": "",
  "last_fingerprint": "",
  "accepted_by_design": [],
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

### Accepted-by-design entry

```json
{ "signature": "...", "location": "path:line", "finding": "...", "rationale": "..." }
```

## Defaults and overrides

| Cap | Default | Override example |
|---|---|---|
| `max_rounds` | 3 | "max 2 rounds" |
| `max_tokens_est` | 400000 | "budget 200k tokens" |
| `max_usd_est` | 3.00 | "budget $1.50" |

## Round focus rotation

| Round | Focus | Scope |
|---|---|---|
| 1 | `full` | All reviewer phases across `merge-base...HEAD` |
| 2 | `delta` | Fixer's diff + previously flagged files; emphasize logic + threat passes |
| 3+ | `confirm` | Full-branch confirming pass only if the previous round changed code; otherwise skip |

## Projective budget check

Before launching a subagent when `active`:

1. If `escalation_pending` → deny.
2. If `round >= max_rounds` and this would start a new review round → deny.
3. Projected next cost = max(last round cost, running average of round costs). If `totals + projected` crosses `max_tokens_est` or `max_usd_est` → deny and escalate with spent / projected / cap.
4. If `last_fingerprint` matches current `pr` fingerprint and `round >= 1` → deny (unchanged tree).

In degraded toolchain mode the orchestrator applies the same checks from `state.json` itself.

## Fingerprint

```bash
python3 scripts/review-lock.py fingerprint pr --json
```

Store the `fingerprint` field on each round and as `last_fingerprint`.
