#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""subagentStart budget guard for the PR review loop."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

# Allow importing sibling modules when run as a script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from _cost import project_next_cost  # noqa: E402
from _loop_state import (  # noqa: E402
    allow,
    deny,
    is_active,
    load_state,
    read_stdin_json,
)


def current_pr_fingerprint() -> str:
    """Return the current pr-tier fingerprint via review-lock.py."""
    try:
        result = subprocess.run(
            ["python3", "scripts/review-lock.py", "fingerprint", "pr", "--json"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return ""
    if result.returncode != 0 or not result.stdout.strip():
        return ""
    try:
        import json

        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return ""
    return str(data.get("fingerprint", "") or "")


def main() -> int:
    """Deny new subagents when loop caps or escalations block progress."""
    _ = read_stdin_json()
    state = load_state()
    if not is_active(state):
        allow()
        return 0

    if state.get("escalation_pending"):
        deny(
            "PR review loop escalation is pending — resolve it before another round.",
            "Budget hook denied subagentStart: escalation_pending=true.",
        )
        return 0

    round_n = int(state.get("round", 0) or 0)
    max_rounds = int(state.get("max_rounds", 3) or 3)
    # Allow fixer within the current round; deny starting a review past the cap.
    # Heuristic: if rounds list length == round_n and round_n >= max_rounds, deny.
    rounds_raw = state.get("rounds")
    rounds: list[object] = rounds_raw if isinstance(rounds_raw, list) else []
    if round_n >= max_rounds and len(rounds) >= max_rounds:
        deny(
            f"PR review loop hit max_rounds={max_rounds}. Raise the cap or stop.",
            "Budget hook denied subagentStart: round cap reached.",
        )
        return 0

    last_fp = str(state.get("last_fingerprint", "") or "")
    if last_fp and round_n >= 1:
        current_fp = current_pr_fingerprint()
        if current_fp and current_fp == last_fp:
            # Only deny a *new review* when tree unchanged — allow fixer if
            # the latest round has findings but no fix yet.
            latest = rounds[-1] if rounds else None
            if isinstance(latest, dict) and latest.get("fixed"):
                deny(
                    "PR fingerprint unchanged since last review — nothing new to scan.",
                    "Budget hook denied subagentStart: unchanged fingerprint.",
                )
                return 0

    totals_raw = state.get("totals")
    totals: dict[str, object] = totals_raw if isinstance(totals_raw, dict) else {}
    raw_t = totals.get("tokens_est", 0)
    raw_u = totals.get("usd_est", 0)
    spent_t = float(raw_t) if isinstance(raw_t, int | float | str) else 0.0
    spent_u = float(raw_u) if isinstance(raw_u, int | float | str) else 0.0
    proj_t, proj_u = project_next_cost(state)
    max_t = float(state.get("max_tokens_est", 400_000) or 400_000)
    max_u = float(state.get("max_usd_est", 3.0) or 3.0)

    if spent_t + proj_t > max_t or spent_u + proj_u > max_u:
        deny(
            (
                f"Projected spend would exceed budget. "
                f"spent≈{spent_t:.0f} tok / ${spent_u:.2f}; "
                f"projected next≈{proj_t:.0f} tok / ${proj_u:.2f}; "
                f"caps={max_t:.0f} tok / ${max_u:.2f}. "
                "Raise the budget to continue, or stop."
            ),
            "Budget hook denied subagentStart: projective cost cap.",
        )
        return 0

    allow()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
