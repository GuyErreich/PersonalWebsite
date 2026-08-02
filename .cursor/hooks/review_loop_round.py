#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""subagentStop round accounting for the PR review loop."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _cost import estimate_since, project_next_cost  # noqa: E402
from _loop_state import (  # noqa: E402
    emit,
    is_active,
    is_loop_subagent,
    load_pricing,
    load_state,
    loop_subagent_type,
    now_iso,
    read_stdin_json,
    resolve_max_rounds,
    save_state,
)


def resolve_clean_passes_required(state: dict[str, Any]) -> int:
    """How many consecutive clean full reviews are required before success stop."""
    raw = state.get("clean_passes_required", 2)
    try:
        value = int(raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 2
    return max(1, value)


def decide_round_followup(state: dict[str, Any], event: dict[str, Any] | None = None) -> str:
    """Advise the orchestrator after a loop subagent stops.

    Do **not** declare success from an empty ``findings`` list here — the
    orchestrator usually writes findings *after* subagentStop, so an empty
    list would false-trigger "passed". Success is consecutive clean reviews
    recorded by the orchestrator per the skill (default 2) or budget/escalation.
    """
    event = event or {}
    if state.get("escalation_pending"):
        return (
            "PR review loop: escalation pending — pause and alert the user. "
            "Do not start another subagent."
        )

    round_n = int(state.get("round", 0) or 0)
    max_rounds = resolve_max_rounds(state)
    totals_raw = state.get("totals")
    totals: dict[str, Any] = totals_raw if isinstance(totals_raw, dict) else {}
    proj_t, proj_u = project_next_cost(state)
    spent_t = float(totals.get("tokens_est", 0) or 0)
    spent_u = float(totals.get("usd_est", 0) or 0)
    max_t = float(state.get("max_tokens_est", 400_000) or 400_000)
    max_u = float(state.get("max_usd_est", 3.0) or 3.0)
    required = resolve_clean_passes_required(state)
    consecutive = int(state.get("consecutive_clean_passes", 0) or 0)
    sub = loop_subagent_type(event)

    if spent_t + proj_t > max_t or spent_u + proj_u > max_u:
        return (
            "PR review loop: projected spend would exceed budget — escalate "
            "to the user with spent/projected/cap, then write the canvas if "
            "they stop."
        )

    if max_rounds is not None and round_n > max_rounds:
        return (
            "PR review loop: round cap reached — write the summary canvas "
            "and set active=false."
        )

    if consecutive >= required:
        return (
            f"PR review loop: {consecutive}/{required} consecutive clean "
            "full reviews already recorded — write the summary canvas and "
            "set active=false."
        )

    if sub == "pr-reviewer":
        return (
            "PR review loop: reviewer finished — collect the findings table "
            "into state, apply the closed-finding filter, then: "
            "(1) if open findings remain → triage + pr-fixer; "
            f"(2) if zero open findings → bump consecutive_clean_passes "
            f"(now {consecutive}/{required}) and launch another full "
            "pr-reviewer until consecutive cleans hit the requirement OR "
            "budget/escalation; "
            "(3) never stop on a single clean pass; never treat "
            "same-signature leftovers as passed — escalate recurrence."
        )

    if sub == "pr-fixer":
        return (
            "PR review loop: fixer finished — reset is not needed here; "
            "launch a fresh full pr-reviewer for the next round. Keep looping "
            f"until {required} consecutive clean reviews or budget/escalation."
        )

    return (
        "PR review loop: continue — launch the next subagent per the skill. "
        f"Success requires {required} consecutive clean full reviews (or "
        "budget/escalation), not a single clean pass."
    )


def main() -> int:
    """Record cost for a finished subagent and advise the parent on next steps."""
    event = read_stdin_json()
    state = load_state()
    if not is_active(state) or not is_loop_subagent(event):
        emit({})
        return 0

    # User + project hooks can both fire; skip a duplicate within 2s.
    last_hook = str(state.get("_last_round_hook_at") or "")
    if last_hook:
        try:
            from datetime import datetime

            elapsed = (
                datetime.fromisoformat(now_iso().replace("Z", "+00:00"))
                - datetime.fromisoformat(last_hook.replace("Z", "+00:00"))
            ).total_seconds()
            if 0 <= elapsed < 2.0:
                emit({})
                return 0
        except ValueError:
            pass
    state["_last_round_hook_at"] = now_iso()

    pricing = load_pricing()
    rounds = state.get("rounds") if isinstance(state.get("rounds"), list) else []
    model = str(event.get("model") or state.get("next_model") or "inherit")
    if rounds and isinstance(rounds[-1], dict):
        latest = rounds[-1]
        fixer_at = str(latest.get("fixer_started_at") or "")
        reviewer_at = str(latest.get("reviewer_started_at") or "")
        if fixer_at and (not reviewer_at or fixer_at >= reviewer_at):
            model = str(
                event.get("model")
                or state.get("fixer_model")
                or state.get("next_model")
                or "inherit"
            )
        else:
            model = str(
                event.get("model")
                or state.get("reviewer_model")
                or state.get("next_model")
                or "inherit"
            )

    started = ""
    if rounds and isinstance(rounds[-1], dict):
        latest = rounds[-1]
        started = str(
            latest.get("fixer_started_at")
            or latest.get("reviewer_started_at")
            or latest.get("started_at")
            or ""
        )
    if not started:
        started = str(state.get("started_at") or "")

    cost = estimate_since(
        pricing,
        started_at_iso=started or now_iso(),
        model=model,
        state=state,
    )
    cost_dict = cost.to_dict()

    totals = state.setdefault("totals", {})
    if not isinstance(totals, dict):
        totals = {}
        state["totals"] = totals
    totals["tokens_est"] = float(totals.get("tokens_est", 0) or 0) + cost.tokens_est
    totals["usd_est"] = round(float(totals.get("usd_est", 0) or 0) + cost.usd_est, 4)
    totals["turns"] = int(totals.get("turns", 0) or 0) + cost.turns
    totals["tool_calls"] = int(totals.get("tool_calls", 0) or 0) + cost.tool_calls

    if rounds and isinstance(rounds[-1], dict):
        existing = rounds[-1].get("cost")
        if isinstance(existing, dict) and existing.get("tokens_est"):
            rounds[-1]["cost"] = {
                "tokens_in_est": int(existing.get("tokens_in_est", 0) or 0)
                + cost.tokens_in_est,
                "tokens_out_est": int(existing.get("tokens_out_est", 0) or 0)
                + cost.tokens_out_est,
                "tokens_est": int(existing.get("tokens_est", 0) or 0) + cost.tokens_est,
                "usd_est": round(
                    float(existing.get("usd_est", 0) or 0) + cost.usd_est, 4
                ),
                "turns": int(existing.get("turns", 0) or 0) + cost.turns,
                "tool_calls": int(existing.get("tool_calls", 0) or 0) + cost.tool_calls,
                "wall_clock_s": float(existing.get("wall_clock_s", 0) or 0),
                "model": cost.model,
                "assumptions": cost.assumptions,
            }
        else:
            rounds[-1]["cost"] = cost_dict

    save_state(state)

    emit({"followup_message": decide_round_followup(state, event)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
