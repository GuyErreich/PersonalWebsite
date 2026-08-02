#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""Estimate tokens and dollars from Cursor agent-transcript JSONL files.

Cursor does not persist billed token counts. This reconstructs an estimate by
modelling context re-send: every assistant turn re-sends prior messages. A
naive character count would understate the bill.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass
class CostEstimate:
    """Estimated cost for one or more transcripts."""

    tokens_in_est: int
    tokens_out_est: int
    tokens_est: int
    usd_est: float
    turns: int
    tool_calls: int
    wall_clock_s: float
    model: str
    assumptions: str
    known_model: bool

    def to_dict(self) -> dict[str, Any]:
        """Serialize for state.json."""
        return asdict(self)


def _message_text(message: dict[str, Any]) -> str:
    """Flatten a transcript message content into plain text for sizing."""
    content = message.get("content")
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for block in content:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "text":
            parts.append(str(block.get("text", "")))
        elif "input" in block:
            parts.append(json.dumps(block.get("input"), default=str))
        elif "name" in block:
            parts.append(str(block.get("name", "")))
    return "\n".join(parts)


def _count_tool_calls(message: dict[str, Any]) -> int:
    """Count tool-call content blocks in a message."""
    content = message.get("content")
    if not isinstance(content, list):
        return 0
    count = 0
    for block in content:
        if (
            isinstance(block, dict)
            and block.get("type")
            in {
                "tool_use",
                "tool_call",
                "function_call",
            }
            or isinstance(block, dict)
            and "name" in block
            and "input" in block
        ):
            count += 1
    return count


def read_transcript(path: Path) -> list[dict[str, Any]]:
    """Load a JSONL transcript into a list of message objects."""
    rows: list[dict[str, Any]] = []
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return rows
    for line in text.splitlines():
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            rows.append(obj)
    return rows


def estimate_transcript(
    path: Path,
    pricing: dict[str, Any],
    model: str = "default",
) -> CostEstimate:
    """Estimate cost for a single transcript with context re-send modelling.

    Args:
        path: Path to a ``*.jsonl`` transcript.
        pricing: Loaded pricing table (chars_per_token, cached_prefix_discount,
            models).
        model: Model key for rate lookup.

    Returns:
        CostEstimate with token/dollar ranges expressed as point estimates and
        assumptions string for canvas captions.
    """
    chars_per_token = float(pricing.get("chars_per_token", 3.9) or 3.9)
    if chars_per_token <= 0:
        chars_per_token = 3.9
    discount = float(pricing.get("cached_prefix_discount", 0.5) or 0.5)
    discount = min(max(discount, 0.0), 1.0)

    models_raw = pricing.get("models")
    models: dict[str, Any] = models_raw if isinstance(models_raw, dict) else {}
    model_rates = models.get(model)
    rates: dict[str, Any]
    if isinstance(model_rates, dict):
        rates = model_rates
        known_model = True
    else:
        default_rates = models.get("default")
        rates = default_rates if isinstance(default_rates, dict) else {}
        known_model = False
    input_rate = float(rates.get("input_per_mtok", 2.0) or 2.0)
    output_rate = float(rates.get("output_per_mtok", 10.0) or 10.0)

    rows = read_transcript(path)
    cumulative_chars = 0
    tokens_in = 0.0
    tokens_out = 0.0
    turns = 0
    tool_calls = 0
    prior_prefix_chars = 0

    for row in rows:
        role = row.get("role")
        message = row.get("message") if isinstance(row.get("message"), dict) else row
        if role not in {"user", "assistant"} and row.get("type") not in {
            None,
            "message",
        }:
            continue
        if role not in {"user", "assistant"}:
            continue

        text = _message_text(message if isinstance(message, dict) else {})
        chars = len(text)
        tool_calls += _count_tool_calls(message if isinstance(message, dict) else {})

        if role == "user":
            cumulative_chars += chars
            continue

        # assistant turn: bill cumulative context as input, this turn as output
        turns += 1
        # Discount the repeated prefix (everything already in prior turns)
        fresh_chars = max(cumulative_chars - prior_prefix_chars, 0)
        cached_chars = prior_prefix_chars
        effective_input_chars = fresh_chars + (cached_chars * (1.0 - discount))
        tokens_in += effective_input_chars / chars_per_token
        tokens_out += chars / chars_per_token
        prior_prefix_chars = cumulative_chars
        cumulative_chars += chars

    tokens_in_i = int(round(tokens_in))
    tokens_out_i = int(round(tokens_out))
    tokens_total = tokens_in_i + tokens_out_i

    usd = 0.0
    if known_model or "default" in models:
        usd = (tokens_in_i / 1_000_000.0) * input_rate + (
            tokens_out_i / 1_000_000.0
        ) * output_rate

    updated = str(pricing.get("updated", "unknown"))
    assumptions = (
        f"chars/token {chars_per_token}; cached_prefix_discount {discount}; "
        f"prices dated {updated}; model={model}"
        + ("" if known_model else " (unknown model — default rates)")
    )

    try:
        mtime = path.stat().st_mtime
        # wall clock unknown without start stamp; leave 0 here
        _ = mtime
    except OSError:
        pass

    return CostEstimate(
        tokens_in_est=tokens_in_i,
        tokens_out_est=tokens_out_i,
        tokens_est=tokens_total,
        usd_est=round(usd, 4),
        turns=turns,
        tool_calls=tool_calls,
        wall_clock_s=0.0,
        model=model if known_model else f"{model}|default",
        assumptions=assumptions,
        known_model=known_model,
    )


def find_subagent_transcripts(
    started_at_iso: str | None = None,
    transcripts_root: Path | None = None,
) -> list[Path]:
    """Find subagent JSONL files newer than started_at under agent-transcripts.

    Args:
        started_at_iso: ISO timestamp; only files with mtime >= this are kept.
        transcripts_root: Override root (tests). Default walks Cursor projects.

    Returns:
        Newest-first list of matching transcript paths.
    """
    roots: list[Path] = []
    if transcripts_root is not None:
        roots.append(transcripts_root)
    else:
        projects = Path.home() / ".cursor" / "projects"
        if projects.is_dir():
            roots.extend(projects.iterdir())

    cutoff = 0.0
    if started_at_iso:
        try:
            from datetime import datetime

            cutoff = datetime.fromisoformat(
                started_at_iso.replace("Z", "+00:00")
            ).timestamp()
        except ValueError:
            cutoff = 0.0

    found: list[Path] = []
    for root in roots:
        sub = root / "agent-transcripts"
        if not sub.is_dir():
            # also accept root itself as a chat dir
            candidates = list(root.glob("**/subagents/*.jsonl"))
        else:
            candidates = list(sub.glob("**/subagents/*.jsonl"))
        for path in candidates:
            try:
                if path.stat().st_mtime >= cutoff - 1.0:
                    found.append(path)
            except OSError:
                continue

    found.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return found


def estimate_since(
    pricing: dict[str, Any],
    started_at_iso: str,
    model: str = "default",
    transcripts_root: Path | None = None,
) -> CostEstimate:
    """Sum estimates for all subagent transcripts written since started_at."""
    paths = find_subagent_transcripts(started_at_iso, transcripts_root)
    if not paths:
        return CostEstimate(
            tokens_in_est=0,
            tokens_out_est=0,
            tokens_est=0,
            usd_est=0.0,
            turns=0,
            tool_calls=0,
            wall_clock_s=0.0,
            model=model,
            assumptions="no transcripts found since started_at",
            known_model=False,
        )

    # Prefer the newest single transcript if many (one subagent per stamp)
    primary = paths[0]
    est = estimate_transcript(primary, pricing, model=model)
    # If multiple new transcripts share the same stamp window, sum them
    if len(paths) > 1:
        for extra in paths[1:]:
            # Only include if very close in time to primary (same round)
            try:
                if abs(extra.stat().st_mtime - primary.stat().st_mtime) > 600:
                    continue
            except OSError:
                continue
            other = estimate_transcript(extra, pricing, model=model)
            est = CostEstimate(
                tokens_in_est=est.tokens_in_est + other.tokens_in_est,
                tokens_out_est=est.tokens_out_est + other.tokens_out_est,
                tokens_est=est.tokens_est + other.tokens_est,
                usd_est=round(est.usd_est + other.usd_est, 4),
                turns=est.turns + other.turns,
                tool_calls=est.tool_calls + other.tool_calls,
                wall_clock_s=est.wall_clock_s + other.wall_clock_s,
                model=est.model,
                assumptions=est.assumptions,
                known_model=est.known_model and other.known_model,
            )
    return est


def project_next_cost(state: dict[str, Any]) -> tuple[float, float]:
    """Project next-round tokens and USD from prior rounds.

    Uses max(last round, running average). Returns (tokens, usd).
    """
    rounds = state.get("rounds")
    if not isinstance(rounds, list) or not rounds:
        # cold start projection — conservative half of default budget
        return 80_000.0, 0.75

    costs: list[tuple[float, float]] = []
    for entry in rounds:
        if not isinstance(entry, dict):
            continue
        cost = entry.get("cost")
        if not isinstance(cost, dict):
            continue
        costs.append(
            (
                float(cost.get("tokens_est", 0) or 0),
                float(cost.get("usd_est", 0) or 0),
            )
        )
    if not costs:
        return 80_000.0, 0.75

    last_t, last_u = costs[-1]
    avg_t = sum(t for t, _ in costs) / len(costs)
    avg_u = sum(u for _, u in costs) / len(costs)
    return max(last_t, avg_t), max(last_u, avg_u)


def workspace_env_hint() -> str | None:
    """Return CURSOR_PROJECT or similar env hint if set."""
    return os.environ.get("CURSOR_PROJECT_DIR") or os.environ.get("CURSOR_WORKSPACE")
