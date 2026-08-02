#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""subagentStop round accounting for the PR review loop."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _cost import estimate_since, project_next_cost  # noqa: E402
from _loop_state import (  # noqa: E402
    emit,
    is_active,
    load_pricing,
    load_state,
    now_iso,
    read_stdin_json,
    save_state,
)


def main() -> int:
    """Record cost for a finished subagent and advise the parent on next steps."""
    event = read_stdin_json()
    state = load_state()
    if not is_active(state):
        emit({})
        return 0

    pricing = load_pricing()
    model = str(event.get("model") or state.get("model") or "default")

    started = ""
    rounds = state.get("rounds") if isinstance(state.get("rounds"), list) else []
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

    cost = estimate_since(pricing, started_at_iso=started or now_iso(), model=model)
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

    if state.get("escalation_pending"):
        followup = (
            "PR review loop: escalation pending — pause and alert the user. "
            "Do not start another subagent."
        )
    else:
        round_n = int(state.get("round", 0) or 0)
        max_rounds = int(state.get("max_rounds", 3) or 3)
        proj_t, proj_u = project_next_cost(state)
        spent_t = float(totals.get("tokens_est", 0) or 0)
        spent_u = float(totals.get("usd_est", 0) or 0)
        max_t = float(state.get("max_tokens_est", 400_000) or 400_000)
        max_u = float(state.get("max_usd_est", 3.0) or 3.0)

        latest = rounds[-1] if rounds and isinstance(rounds[-1], dict) else {}
        findings = latest.get("findings") if isinstance(latest, dict) else None
        fixed = latest.get("fixed") if isinstance(latest, dict) else None
        new_sigs = latest.get("new_signatures") if isinstance(latest, dict) else None

        if isinstance(findings, list) and len(findings) == 0:
            followup = (
                "PR review loop: zero findings — write the summary canvas and set "
                "active=false."
            )
        elif isinstance(new_sigs, list) and len(new_sigs) == 0 and round_n > 1:
            followup = (
                "PR review loop: no new finding signatures — write the summary "
                "canvas and set active=false."
            )
        elif round_n >= max_rounds and isinstance(fixed, list):
            followup = (
                "PR review loop: round cap reached — write the summary canvas "
                "and set active=false."
            )
        elif spent_t + proj_t > max_t or spent_u + proj_u > max_u:
            followup = (
                "PR review loop: projected spend would exceed budget — escalate "
                "to the user with spent/projected/cap, then write the canvas if "
                "they stop."
            )
        elif isinstance(findings, list) and findings and not fixed:
            followup = (
                "PR review loop: review complete with findings — triage via "
                "triage-policy, then launch pr-fixer for auto-approved rows only."
            )
        else:
            followup = (
                "PR review loop: continue — launch a fresh pr-reviewer for the "
                "next round (review first), or write the canvas if stop "
                "conditions are met."
            )

    emit({"followup_message": followup})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
