#!/bin/bash
# Interpreter resolver for review-loop Python hooks.
# Works as a project hook (cwd = repo) or user hook (cwd = ~/.cursor/).
# Always exits 0 with valid JSON so failClosed only fires on genuine crashes.
#
# Extra args after the script name are forwarded (e.g. review_loop_cost.py record …).
set -eu

case "$0" in
  /*) _self="$0" ;;
  *) _self="$PWD/$0" ;;
esac
HOOKS_DIR="${_self%/*}"

SCRIPT_NAME="${1:-}"
if [ -z "$SCRIPT_NAME" ]; then
  printf '%s\n' '{"permission":"allow","agent_message":"run-python.sh: missing script name"}'
  exit 0
fi
shift
EXTRA_ARGS=("$@")

python_is_ok() {
  bin="${1:-}"
  [ -n "$bin" ] && [ -x "$bin" ] || return 1
  ver="$("$bin" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
  major="${ver%%.*}"
  minor="${ver#*.}"
  [ "${major:-0}" -gt 3 ] || { [ "${major:-0}" -eq 3 ] && [ "${minor:-0}" -ge 12 ]; }
}

find_uv() {
  for cand in \
    "$(command -v uv 2>/dev/null || true)" \
    "${HOME}/.local/bin/uv" \
    /usr/local/bin/uv \
    "${HOME}/.cargo/bin/uv"
  do
    if [ -n "$cand" ] && [ -x "$cand" ]; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  return 1
}

find_python() {
  if [ -n "${REVIEW_LOOP_PYTHON:-}" ]; then
    if python_is_ok "$REVIEW_LOOP_PYTHON"; then
      printf '%s\n' "$REVIEW_LOOP_PYTHON"
      return 0
    fi
    resolved="$(command -v "$REVIEW_LOOP_PYTHON" 2>/dev/null || true)"
    if python_is_ok "$resolved"; then
      printf '%s\n' "$resolved"
      return 0
    fi
  fi
  for cand in \
    "$(command -v python3 2>/dev/null || true)" \
    /usr/bin/python3 \
    /usr/local/bin/python3 \
    /opt/homebrew/bin/python3
  do
    if python_is_ok "$cand"; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  return 1
}

detect_mode() {
  if [ -n "${REVIEW_LOOP_PYTHON:-}" ] && python_is_ok "$REVIEW_LOOP_PYTHON"; then
    printf '%s\n' "python3 fallback"
    return 0
  fi
  if UV_BIN="$(find_uv)"; then
    printf '%s\n' "uv"
    return 0
  fi
  if find_python >/dev/null; then
    printf '%s\n' "python3 fallback"
    return 0
  fi
  printf '%s\n' "hooks degraded"
}

if [ "$SCRIPT_NAME" = "--detect" ]; then
  detect_mode
  exit 0
fi

SCRIPT_PATH="$HOOKS_DIR/$SCRIPT_NAME"

INPUT=""
if [ ! -t 0 ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    INPUT="${INPUT}${line}
"
  done
fi

# Resolve active workspace: REVIEW_LOOP_ROOT > workspace_roots[0] > git toplevel > cwd
resolve_root() {
  if [ -n "${REVIEW_LOOP_ROOT:-}" ] && [ -d "$REVIEW_LOOP_ROOT" ]; then
    printf '%s\n' "$REVIEW_LOOP_ROOT"
    return
  fi
  py="$(find_python 2>/dev/null || command -v python3 2>/dev/null || true)"
  if [ -n "$py" ]; then
    root="$(REVIEW_LOOP_HOOK_INPUT="$INPUT" "$py" - <<'PY' 2>/dev/null || true
import json, os, subprocess
from pathlib import Path
raw = os.environ.get("REVIEW_LOOP_HOOK_INPUT", "")
roots = []
try:
    data = json.loads(raw) if raw.strip() else {}
    wr = data.get("workspace_roots") or []
    if isinstance(wr, list):
        roots = [str(x) for x in wr if x]
except Exception:
    pass
for cand in roots:
    p = Path(cand)
    if p.is_dir():
        print(p)
        raise SystemExit(0)
# Prefer git toplevel from cwd when it looks like a project checkout
try:
    r = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=False,
    )
    if r.returncode == 0 and r.stdout.strip():
        print(r.stdout.strip())
        raise SystemExit(0)
except Exception:
    pass
print(Path.cwd())
PY
)"
    if [ -n "$root" ] && [ -d "$root" ]; then
      printf '%s\n' "$root"
      return
    fi
  fi
  printf '%s\n' "$PWD"
}

REPO_ROOT="$(resolve_root)"
export REVIEW_LOOP_ROOT="$REPO_ROOT"
STATE_DIR="$REPO_ROOT/.review-loop"
DEGRADED_JSON="$STATE_DIR/hook-degraded.json"
ALERT_MARKER="$STATE_DIR/.toolchain-alert"

degraded_default() {
  case "$SCRIPT_NAME" in
    review_loop_budget.py) printf '%s\n' '{"permission":"allow"}' ;;
    review_loop_round.py) printf '%s\n' '{}' ;;
    review_loop_git_guard.py) printf '%s\n' '{"permission":"ask","user_message":"Review-loop hooks degraded (no usable Python). Approve shell commands carefully."}' ;;
    npm_dep_gate.py) printf '%s\n' '{}' ;;
    *) printf '%s\n' '{"permission":"allow"}' ;;
  esac
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'
}

record_degraded() {
  reason="$1"
  mkdir -p "$STATE_DIR" 2>/dev/null || true
  at="$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || true)"
  py="$(command -v python3 2>/dev/null || true)"
  if [ -n "$py" ]; then
    REASON="$reason" SCRIPT="$SCRIPT_NAME" AT="$at" SPATH="$SCRIPT_PATH" \
      "$py" -c '
import json, os
print(json.dumps({
    "reason": os.environ.get("REASON", ""),
    "script": os.environ.get("SCRIPT", ""),
    "at": os.environ.get("AT", ""),
    "path": os.environ.get("SPATH", ""),
}))
' >"$DEGRADED_JSON" 2>/dev/null || true
  else
    printf '%s\n' "{\"reason\":\"$(json_escape "$reason")\",\"script\":\"$(json_escape "$SCRIPT_NAME")\",\"at\":\"$(json_escape "$at")\",\"path\":\"$(json_escape "$SCRIPT_PATH")\"}" \
      >"$DEGRADED_JSON" 2>/dev/null || true
  fi
  printf '%s\n' "$reason" >&2
}

clear_degraded() {
  rm -f "$DEGRADED_JSON" "$ALERT_MARKER" 2>/dev/null || true
}

run_script() {
  kind="$1"
  bin="$2"
  if [ "$kind" = "uv" ]; then
    ( cd "$REPO_ROOT" && printf '%s' "$INPUT" | "$bin" run --script "$SCRIPT_PATH" "${EXTRA_ARGS[@]}" )
  else
    ( cd "$REPO_ROOT" && printf '%s' "$INPUT" | "$bin" "$SCRIPT_PATH" "${EXTRA_ARGS[@]}" )
  fi
}

if [ ! -f "$SCRIPT_PATH" ]; then
  record_degraded "script not found: $SCRIPT_PATH"
  degraded_default
  exit 0
fi

if [ -z "${REVIEW_LOOP_PYTHON:-}" ]; then
  if UV_BIN="$(find_uv)"; then
    if run_script "uv" "$UV_BIN"; then
      clear_degraded
      exit 0
    fi
    record_degraded "uv run failed for $SCRIPT_NAME"
    degraded_default
    exit 0
  fi
fi

if PY_BIN="$(find_python)"; then
  if [ -z "${REVIEW_LOOP_PYTHON:-}" ]; then
    printf '%s\n' "uv not found — review-loop hooks are running on system python3. Install uv for the pinned toolchain: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  fi
  if run_script "python3" "$PY_BIN"; then
    clear_degraded
    exit 0
  fi
  record_degraded "python3 run failed for $SCRIPT_NAME"
  degraded_default
  exit 0
fi

record_degraded "no usable interpreter (need uv or python3>=3.12). Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
degraded_default
exit 0
