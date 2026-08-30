#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""Orchestrator-side cost recording for the PR review loop.

The ``subagentStop`` hook is the primary meter, but Cursor's hook environment
can silently degrade. The orchestrator calls this after every loop subagent
returns so totals still grow. Duplicate keys are no-ops via
``_cost_recorded_for``.

Usage::

    .cursor/hooks/run-python.sh review_loop_cost.py record \\
        --subagent pr-reviewer --transcript <path> --duration-ms <n>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _loop_state import (  # noqa: E402
    emit,
    is_active,
    load_hook_degraded,
    load_pricing,
    load_state,
    save_state,
)
from review_loop_round import (  # noqa: E402
    already_recorded_cost,
    record_round_cost,
)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="review_loop_cost.py",
        description="Record cost for a finished PR review-loop subagent.",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    rec = sub.add_parser("record", help="Accumulate one subagent's cost into state")
    rec.add_argument("--subagent", required=True, help="pr-reviewer or pr-fixer")
    rec.add_argument("--transcript", default="", help="agent_transcript_path")
    rec.add_argument("--duration-ms", type=float, default=None)
    rec.add_argument("--message-count", type=int, default=None)
    rec.add_argument("--tool-call-count", type=int, default=None)
    rec.add_argument("--model", default="")
    rec.add_argument("--status", default="completed")
    return parser.parse_args(argv)


def _event_from_args(args: argparse.Namespace) -> dict[str, Any]:
    event: dict[str, Any] = {
        "subagent_type": str(args.subagent).strip(),
        "status": str(args.status or "completed").strip() or "completed",
    }
    transcript = str(args.transcript or "").strip()
    if transcript:
        event["agent_transcript_path"] = transcript
    if args.duration_ms is not None:
        event["duration_ms"] = float(args.duration_ms)
    if args.message_count is not None:
        event["message_count"] = int(args.message_count)
    if args.tool_call_count is not None:
        event["tool_call_count"] = int(args.tool_call_count)
    if args.model:
        event["subagent_model"] = str(args.model)
    return event


def _totals_payload(
    state: dict[str, Any],
    *,
    skipped: str | None = None,
    recorded: dict[str, Any] | None = None,
) -> dict[str, Any]:
    totals_raw = state.get("totals")
    totals = totals_raw if isinstance(totals_raw, dict) else {}
    payload: dict[str, Any] = {
        "totals": {
            "tokens_est": float(totals.get("tokens_est", 0) or 0),
            "usd_est": float(totals.get("usd_est", 0) or 0),
            "turns": int(totals.get("turns", 0) or 0),
            "tool_calls": int(totals.get("tool_calls", 0) or 0),
            "wall_clock_s": float(totals.get("wall_clock_s", 0) or 0),
        },
        "degraded": load_hook_degraded() is not None,
    }
    if skipped:
        payload["skipped"] = skipped
    if recorded is not None:
        payload["recorded"] = recorded
    return payload


def record_from_args(args: argparse.Namespace, state: dict[str, Any]) -> dict[str, Any]:
    """Apply one ``record`` invocation to ``state``; return the emit payload."""
    event = _event_from_args(args)
    if not is_active(state):
        return _totals_payload(state, skipped="loop inactive")
    if already_recorded_cost(state, event):
        return _totals_payload(state, skipped="already recorded")
    pricing = load_pricing()
    cost = record_round_cost(state, event, pricing)
    save_state(state)
    return _totals_payload(state, recorded=cost.to_dict())


def main(argv: list[str] | None = None) -> int:
    """CLI entry: record one finished subagent into ``state.json``."""
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if args.command != "record":
        emit({"error": f"unknown command: {args.command}"})
        return 0
    state = load_state()
    emit(record_from_args(args, state))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
