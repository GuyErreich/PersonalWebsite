#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
"""Shared state and JSON helpers for review-loop hooks."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

STATE_DIR = Path(".cursor/review-loop")
STATE_PATH = STATE_DIR / "state.json"
PRICING_PATH = STATE_DIR / "pricing.json"
PREFERENCES_PATH = STATE_DIR / "preferences.json"
DEFAULT_PRICING_REL = Path(
    ".cursor/skills/code/ci/pr-review-loop/assets/pricing.default.json"
)
# User-level skills symlink (~/.cursor/skills → portable plugin)
DEFAULT_PRICING_USER = (
    Path.home()
    / ".cursor"
    / "skills"
    / "code"
    / "ci"
    / "pr-review-loop"
    / "assets"
    / "pricing.default.json"
)

# Caps / models that survive across loop runs (not wiped on each preflight).
PREFERENCE_KEYS = (
    "max_rounds",
    "max_tokens_est",
    "max_usd_est",
    "pricing_mode",
    "reviewer_model",
    "fixer_model",
    "clean_passes_required",
)


def now_iso() -> str:
    """Return current UTC time as ISO-8601 without microseconds."""
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def repo_root() -> Path:
    """Resolve the active workspace root.

    Order: ``REVIEW_LOOP_ROOT`` (set by run-python.sh) → git toplevel → cwd.
    User-level hooks start in ``~/.cursor/``; the shim exports the workspace.
    """
    env = os.environ.get("REVIEW_LOOP_ROOT", "").strip()
    if env:
        path = Path(env)
        if path.is_dir():
            return path
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return Path(result.stdout.strip())
    except OSError:
        pass
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
    """Write state.json; never raise — hooks must always emit JSON."""
    path = state_path(root)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    except OSError as exc:
        print(f"review-loop: could not write state.json: {exc}", file=sys.stderr)


def preferences_path(root: Path | None = None) -> Path:
    """Return absolute path to preferences.json (durable caps across runs)."""
    base = root or repo_root()
    return base / PREFERENCES_PATH


def default_preferences() -> dict[str, Any]:
    """Built-in defaults used only when preferences.json is missing a key."""
    return {
        "max_rounds": 3,
        "max_tokens_est": 1_000_000,
        "max_usd_est": 2.0,
        "pricing_mode": "auto",
        "reviewer_model": "inherit",
        "fixer_model": "inherit",
        "clean_passes_required": 2,
    }


def load_preferences(root: Path | None = None) -> dict[str, Any]:
    """Load durable loop preferences; fill missing keys from defaults.

    Explicit ``null`` for ``max_rounds`` is preserved (budget-only / unlimited).
    """
    prefs = default_preferences()
    path = preferences_path(root)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return prefs
    if not isinstance(data, dict):
        return prefs
    for key in PREFERENCE_KEYS:
        if key not in data:
            continue
        # Allow explicit null for max_rounds (unlimited).
        if key == "max_rounds" or data[key] is not None:
            prefs[key] = data[key]
    return prefs


def save_preferences(data: dict[str, Any], root: Path | None = None) -> None:
    """Persist preference keys only (never wipe with a full state dump)."""
    path = preferences_path(root)
    merged = default_preferences()
    for key in PREFERENCE_KEYS:
        if key in data:
            merged[key] = data[key]
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    except OSError as exc:
        print(
            f"review-loop: could not write preferences.json: {exc}",
            file=sys.stderr,
        )


def apply_preference_overrides(
    prefs: dict[str, Any], overrides: dict[str, Any]
) -> dict[str, Any]:
    """Return a copy of prefs with invocation overrides applied."""
    merged = dict(prefs)
    for key in PREFERENCE_KEYS:
        if key not in overrides:
            continue
        if key == "max_rounds":
            merged[key] = overrides[key]
            continue
        if overrides[key] is not None:
            merged[key] = overrides[key]
    return merged


def start_loop_state(
    *,
    pr_number: int,
    pr_url: str,
    branch: str,
    toolchain_mode: str = "uv",
    pricing_updated: str = "",
    overrides: dict[str, Any] | None = None,
    root: Path | None = None,
) -> dict[str, Any]:
    """Create a fresh run state from durable preferences + this-run overrides.

    Does **not** reset preferences to factory defaults. Invocation overrides
    (e.g. budget-only → ``max_rounds: null``) are written into both
    ``preferences.json`` and the new ``state.json``.
    """
    prefs = apply_preference_overrides(load_preferences(root), overrides or {})
    save_preferences(prefs, root)

    state: dict[str, Any] = {
        "active": False,
        "pr_number": pr_number,
        "pr_url": pr_url,
        "branch": branch,
        "started_at": now_iso(),
        "pricing_mode": prefs.get("pricing_mode", "auto"),
        "reviewer_model": prefs.get("reviewer_model", "inherit"),
        "fixer_model": prefs.get("fixer_model", "inherit"),
        "next_model": prefs.get("reviewer_model", "inherit"),
        "max_rounds": prefs.get("max_rounds"),
        "max_tokens_est": prefs.get("max_tokens_est", 1_000_000),
        "max_usd_est": prefs.get("max_usd_est", 2.0),
        "clean_passes_required": int(prefs.get("clean_passes_required") or 2),
        "consecutive_clean_passes": 0,
        "round": 0,
        "escalation_pending": False,
        "toolchain_mode": toolchain_mode,
        "pricing_updated": pricing_updated,
        "last_fingerprint": "",
        "accepted_by_design": [],
        "closed_findings": [],
        "escalations": [],
        "rounds": [],
        "totals": {
            "tokens_est": 0,
            "usd_est": 0,
            "turns": 0,
            "tool_calls": 0,
            "wall_clock_s": 0,
        },
    }
    save_state(state, root)
    return state


def closed_signatures(state: dict[str, Any]) -> set[str]:
    """Return signature ids already fixed or accepted this loop run."""
    out: set[str] = set()
    for entry in state.get("closed_findings") or []:
        if not isinstance(entry, dict):
            continue
        sig = entry.get("signature")
        if isinstance(sig, str) and sig.strip():
            out.add(sig.strip())
    for entry in state.get("accepted_by_design") or []:
        if not isinstance(entry, dict):
            continue
        sig = entry.get("signature")
        if isinstance(sig, str) and sig.strip():
            out.add(sig.strip())
    return out


def append_closed_finding(
    state: dict[str, Any],
    *,
    signature: str,
    location: str,
    finding: str,
    status: str,
    closed_in_round: int,
    rationale: str = "",
) -> dict[str, Any]:
    """Record a fixed or accepted finding so later rounds do not re-report it.

    Idempotent on ``signature``. When ``status`` is ``accepted``, also mirrors
    into ``accepted_by_design``.
    """
    sig = signature.strip()
    if not sig:
        return state
    if sig in closed_signatures(state):
        return state

    entry: dict[str, Any] = {
        "signature": sig,
        "location": location,
        "finding": finding,
        "status": status,
        "closed_in_round": closed_in_round,
    }
    if rationale:
        entry["rationale"] = rationale

    closed = list(state.get("closed_findings") or [])
    closed.append(entry)
    state["closed_findings"] = closed

    if status == "accepted":
        accepted = list(state.get("accepted_by_design") or [])
        accepted.append(
            {
                "signature": sig,
                "location": location,
                "finding": finding,
                "rationale": rationale,
            }
        )
        state["accepted_by_design"] = accepted
    return state


def filter_open_findings(
    findings: list[dict[str, Any]],
    state: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Split findings into (open, dropped_as_closed) by signature.

    Rows with ``source`` / ``Source`` equal to ``recurrence`` stay open so the
    orchestrator can escalate them once.
    """
    closed = closed_signatures(state)
    open_rows: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []
    for row in findings:
        if not isinstance(row, dict):
            continue
        source = str(row.get("source") or row.get("Source") or "").strip().lower()
        sig = str(row.get("signature") or row.get("Signature") or "").strip()
        if source == "recurrence":
            open_rows.append(row)
            continue
        if sig and sig in closed:
            dropped.append(row)
            continue
        open_rows.append(row)
    return open_rows, dropped


def is_active(state: dict[str, Any]) -> bool:
    """Return True when the review loop is currently running."""
    return bool(state.get("active"))


# Only these Task subagent_type values are gated/accounted by loop hooks.
LOOP_SUBAGENT_TYPES = frozenset({"pr-reviewer", "pr-fixer"})


def loop_subagent_type(event: dict[str, Any] | None) -> str:
    """Extract the Task subagent type from a hook event payload."""
    if not event:
        return ""
    for key in ("subagent_type", "subagentType", "agent_type", "type"):
        raw = event.get(key)
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
    return ""


def is_loop_subagent(event: dict[str, Any] | None) -> bool:
    """Return True when the event is for pr-reviewer or pr-fixer."""
    return loop_subagent_type(event) in LOOP_SUBAGENT_TYPES


def resolve_max_rounds(state: dict[str, Any]) -> int | None:
    """Return the round cap, or ``None`` when rounds are unlimited (budget-only).

    Unlimited when ``max_rounds`` is missing-as-explicit-null, ``0``, ``null``,
    or the strings ``none`` / ``unlimited`` / ``budget`` / ``budget-only``.
    Default when the key is absent: ``3``.
    """
    if "max_rounds" not in state:
        return 3
    raw = state.get("max_rounds")
    if raw is None:
        return None
    if isinstance(raw, str):
        text = raw.strip().lower()
        if text in {"", "none", "null", "unlimited", "inf", "budget", "budget-only"}:
            return None
        try:
            value = int(text)
        except ValueError:
            return 3
    elif isinstance(raw, bool):
        return 3
    elif isinstance(raw, int | float):
        value = int(raw)
    else:
        return 3
    if value <= 0:
        return None
    return value


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
    """Copy default pricing into place when missing or schema-stale; return path."""
    base = root or repo_root()
    dest = base / PRICING_PATH
    src = base / DEFAULT_PRICING_REL
    if not src.is_file() and DEFAULT_PRICING_USER.is_file():
        src = DEFAULT_PRICING_USER

    needs_copy = not dest.is_file()
    if dest.is_file():
        try:
            existing = json.loads(dest.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = {}
        # Refresh when the Auto/api mode table is absent (pre-mode schema).
        if not isinstance(existing, dict) or "modes" not in existing:
            needs_copy = True

    if not needs_copy:
        return dest

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
                    "default_mode": "auto",
                    "modes": {
                        "auto": {
                            "label": "Cursor Auto (routed / included usage)",
                            "usd_multiplier": 1.0,
                            "model_key": "auto",
                            "max_tokens_est": 1_000_000,
                            "max_usd_est": 2.0,
                            "cold_project_tokens": 120_000,
                            "cold_project_usd": 0.15,
                        },
                        "api": {
                            "label": "Named model / API-like list rates",
                            "usd_multiplier": 1.0,
                            "model_key": None,
                            "max_tokens_est": 400_000,
                            "max_usd_est": 3.0,
                            "cold_project_tokens": 80_000,
                            "cold_project_usd": 0.75,
                        },
                    },
                    "models": {
                        "auto": {
                            "input_per_mtok": 0.2,
                            "output_per_mtok": 0.8,
                        },
                        "default": {
                            "input_per_mtok": 2.0,
                            "output_per_mtok": 10.0,
                        },
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
