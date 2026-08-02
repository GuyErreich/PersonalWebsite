#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""Shared state and JSON helpers for review-loop hooks."""

from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

STATE_DIR = Path(".cursor/review-loop")
STATE_PATH = STATE_DIR / "state.json"
PRICING_PATH = STATE_DIR / "pricing.json"
DEFAULT_PRICING = Path(
    ".cursor/skills/code/ci/pr-review-loop/assets/pricing.default.json"
)


def now_iso() -> str:
    """Return current UTC time as ISO-8601 without microseconds."""
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def repo_root() -> Path:
    """Resolve repository root from cwd (hooks run from project root)."""
    return Path.cwd()


def state_path(root: Path | None = None) -> Path:
    """Return absolute path to state.json."""
    base = root or repo_root()
    return base / STATE_PATH


def load_state(root: Path | None = None) -> dict[str, Any]:
    """Load loop state; return empty dict if missing or invalid."""
    path = state_path(root)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}


def save_state(data: dict[str, Any], root: Path | None = None) -> None:
    """Write state.json atomically enough for single-writer use."""
    path = state_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def is_active(state: dict[str, Any]) -> bool:
    """Return True when the review loop is currently running."""
    return bool(state.get("active"))


def read_stdin_json() -> dict[str, Any]:
    """Parse JSON from stdin; return empty dict on empty/invalid input."""
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def emit(payload: dict[str, Any]) -> None:
    """Write a JSON response to stdout."""
    sys.stdout.write(json.dumps(payload))
    sys.stdout.write("\n")


def allow(message: str | None = None) -> None:
    """Emit a permission allow response."""
    payload: dict[str, Any] = {"permission": "allow"}
    if message:
        payload["agent_message"] = message
    emit(payload)


def deny(user_message: str, agent_message: str | None = None) -> None:
    """Emit a permission deny response."""
    payload: dict[str, Any] = {
        "permission": "deny",
        "user_message": user_message,
    }
    if agent_message:
        payload["agent_message"] = agent_message
    emit(payload)


def ask(user_message: str, agent_message: str | None = None) -> None:
    """Emit a permission ask response."""
    payload: dict[str, Any] = {
        "permission": "ask",
        "user_message": user_message,
    }
    if agent_message:
        payload["agent_message"] = agent_message
    emit(payload)


def bootstrap_pricing(root: Path | None = None) -> Path:
    """Copy default pricing into place when missing; return pricing path."""
    base = root or repo_root()
    dest = base / PRICING_PATH
    if dest.is_file():
        return dest
    src = base / DEFAULT_PRICING
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.is_file():
        dest.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        dest.write_text(
            json.dumps(
                {
                    "updated": "unknown",
                    "source": "fallback empty table",
                    "chars_per_token": 3.9,
                    "cached_prefix_discount": 0.5,
                    "models": {
                        "default": {
                            "input_per_mtok": 2.0,
                            "output_per_mtok": 10.0,
                        }
                    },
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    return dest


def load_pricing(root: Path | None = None) -> dict[str, Any]:
    """Load pricing.json, bootstrapping from the default asset if needed."""
    path = bootstrap_pricing(root)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}
