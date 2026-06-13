#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""Review lockfile: fingerprint, check, and record code-review tiers (change / commit / pr)."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

TIERS = frozenset({"change", "commit", "pr"})
LOCK_PATH = Path(".cursor/review-lock.json")
BASE_REFS = ("main", "master", "dev", "origin/main", "origin/master", "origin/dev")


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode == 0 and result.stdout.strip():
        return Path(result.stdout.strip())
    return Path.cwd()


def run_git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode not in (0, 1):
        return ""
    return result.stdout


def digest(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def merge_base(root: Path) -> str:
    for base_ref in BASE_REFS:
        ref = run_git(root, "rev-parse", "--verify", base_ref).strip()
        if not ref:
            continue
        base = run_git(root, "merge-base", "HEAD", ref).strip()
        if base:
            return base
    return run_git(root, "rev-parse", "HEAD~0").strip()


def fingerprint_change(root: Path) -> tuple[str, bool]:
    working = run_git(root, "diff", "HEAD")
    staged = run_git(root, "diff", "--cached")
    payload = "\n".join(part for part in (working, staged) if part).strip()
    if not payload:
        return "", False
    return digest(payload), True


def fingerprint_commit(root: Path) -> tuple[str, str, bool]:
    head = run_git(root, "rev-parse", "HEAD").strip()
    if not head:
        return "", "", False
    parent = run_git(root, "rev-parse", "HEAD~1").strip()
    diff = run_git(root, "diff", f"{parent}..HEAD") if parent else ""
    payload = diff.strip() or head
    return head, digest(payload), True


def fingerprint_pr(root: Path) -> tuple[str, str, bool]:
    base = merge_base(root)
    if not base:
        return "", "", False
    diff = run_git(root, "diff", f"{base}...HEAD")
    payload = diff.strip()
    if not payload:
        return base, "", False
    return base, digest(payload), True


def lock_file(root: Path) -> Path:
    return root / LOCK_PATH


def load_lock(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_lock(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def cmd_fingerprint(root: Path, tier: str, as_json: bool) -> int:
    if tier == "change":
        fp, has = fingerprint_change(root)
        if not has:
            payload = {"tier": tier, "fingerprint": "", "has_diff": False}
        else:
            payload = {"tier": tier, "fingerprint": fp, "has_diff": True}
    elif tier == "commit":
        sha, fp, has = fingerprint_commit(root)
        payload = {"tier": tier, "sha": sha, "fingerprint": fp, "has_commit": has}
    else:
        base, fp, has = fingerprint_pr(root)
        payload = {"tier": tier, "base": base, "fingerprint": fp, "has_diff": has}

    if as_json:
        print(json.dumps(payload))
    elif tier == "change":
        print(payload.get("fingerprint", ""))
    elif tier == "commit":
        print(payload.get("fingerprint", ""))
    else:
        print(payload.get("fingerprint", ""))
    return 0


def tier_current(root: Path, tier: str) -> dict:
    if tier == "change":
        fp, has = fingerprint_change(root)
        return {"fingerprint": fp, "has_diff": has}
    if tier == "commit":
        sha, fp, _has = fingerprint_commit(root)
        return {"sha": sha, "fingerprint": fp}
    base, fp, has = fingerprint_pr(root)
    return {"base": base, "fingerprint": fp, "has_diff": has}


def tier_matches(root: Path, tier: str, entry: dict) -> bool:
    current = tier_current(root, tier)
    if tier == "change":
        if not current["has_diff"]:
            return True
        return entry.get("fingerprint") == current["fingerprint"]
    if tier == "commit":
        return entry.get("sha") == current.get("sha") and bool(current.get("sha"))
    if not current.get("has_diff"):
        return True
    return entry.get("fingerprint") == current.get("fingerprint") and entry.get("base") == current.get("base")


def cmd_check(root: Path, tier: str) -> int:
    current = tier_current(root, tier)
    lock = load_lock(lock_file(root))
    entry = lock.get(tier, {})

    if tier == "change" and not current["has_diff"]:
        print("No uncommitted changes — change tier not required.", file=sys.stderr)
        return 0

    if tier == "pr" and not current.get("has_diff"):
        print("No branch diff vs merge-base — pr tier not required.", file=sys.stderr)
        return 0

    if entry and tier_matches(root, tier, entry):
        verdict = entry.get("verdict", "unknown")
        print(f"{tier} tier already reviewed ({verdict}) — skipping.", file=sys.stderr)
        return 0

    print(f"{tier} tier review required.", file=sys.stderr)
    return 1


def cmd_record(root: Path, tier: str, verdict: str, inherit: str | None) -> int:
    if verdict not in {"passed", "failed"}:
        print("verdict must be passed or failed", file=sys.stderr)
        return 2

    lock = load_lock(lock_file(root))
    entry: dict = {"verdict": verdict, "at": now_iso()}

    if tier == "change":
        fp, has = fingerprint_change(root)
        if not has:
            print("No uncommitted changes to record for change tier.", file=sys.stderr)
            return 1
        entry["fingerprint"] = fp
    elif tier == "commit":
        if inherit == "change":
            change_entry = lock.get("change", {})
            if not change_entry.get("fingerprint"):
                print("Cannot inherit — change tier not recorded.", file=sys.stderr)
                return 1
            sha, _fp, has = fingerprint_commit(root)
            if not has:
                print("No commit at HEAD to record.", file=sys.stderr)
                return 1
            entry["sha"] = sha
            entry["fingerprint"] = change_entry["fingerprint"]
            entry["inherited_from"] = "change"
        else:
            sha, fp, has = fingerprint_commit(root)
            if not has:
                print("No commit at HEAD to record.", file=sys.stderr)
                return 1
            entry["sha"] = sha
            entry["fingerprint"] = fp
    else:
        base, fp, has = fingerprint_pr(root)
        if not has:
            print("No branch diff to record for pr tier.", file=sys.stderr)
            return 1
        entry["base"] = base
        entry["fingerprint"] = fp

    lock[tier] = entry
    save_lock(lock_file(root), lock)
    print(f"Recorded {tier} tier as {verdict}.", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Review lockfile for code-review tiers")
    sub = parser.add_subparsers(dest="command", required=True)

    fp_parser = sub.add_parser("fingerprint", help="Print tier fingerprint")
    fp_parser.add_argument("tier", choices=sorted(TIERS))
    fp_parser.add_argument("--json", action="store_true")

    check_parser = sub.add_parser("check", help="Exit 0 if tier already reviewed")
    check_parser.add_argument("tier", choices=sorted(TIERS))

    record_parser = sub.add_parser("record", help="Record review verdict for tier")
    record_parser.add_argument("tier", choices=sorted(TIERS))
    record_parser.add_argument("--verdict", required=True, choices=["passed", "failed"])
    record_parser.add_argument("--inherit-from", choices=["change"])

    args = parser.parse_args()
    root = repo_root()

    if args.command == "fingerprint":
        return cmd_fingerprint(root, args.tier, args.json)
    if args.command == "check":
        return cmd_check(root, args.tier)
    if args.command == "record":
        inherit = getattr(args, "inherit_from", None)
        return cmd_record(root, args.tier, args.verdict, inherit)
    return 2


if __name__ == "__main__":
    sys.exit(main())
