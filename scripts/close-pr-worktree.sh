#!/usr/bin/env bash
# Remove a PR branch worktree (and local branch) after merge or close.
# Requires wtp (https://github.com/satococoa/wtp) when using the wtp path.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: close-pr-worktree.sh [options] <branch-name|pr-number>

Remove the local worktree and branch for a closed or merged PR.

Options:
  --force-branch   Delete the branch even if it is not merged (for closed PRs)
  -f, --force      Force-remove a dirty worktree
  -h, --help       Show this help

Examples:
  ./scripts/close-pr-worktree.sh fix/r2-presign-browser-apikey
  ./scripts/close-pr-worktree.sh 57
  ./scripts/close-pr-worktree.sh --force-branch feature/experiment
EOF
}

force_worktree=false
force_branch=false
branch=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-branch)
      force_branch=true
      shift
      ;;
    -f | --force)
      force_worktree=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$branch" ]]; then
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      branch="$1"
      shift
      ;;
  esac
done

if [[ -z "$branch" ]]; then
  branch="${GITHUB_HEAD_REF:-${HEAD_BRANCH:-}}"
fi

if [[ -z "$branch" ]]; then
  usage >&2
  exit 1
fi

if [[ "$branch" =~ ^[0-9]+$ ]] && command -v gh >/dev/null 2>&1; then
  branch="$(gh pr view "$branch" --json headRefName --jq .headRefName)"
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

current_branch="$(git branch --show-current 2>/dev/null || true)"
if [[ "$current_branch" == "$branch" ]]; then
  echo "Cannot remove worktree while checked out on branch '$branch'." >&2
  echo "Switch to another branch or worktree first (for example: git switch dev)." >&2
  exit 1
fi

worktree_path=""
while IFS= read -r line; do
  case "$line" in
    worktree*)
      worktree_path="${line#worktree }"
      ;;
    branch*)
      tracked_branch="${line#branch refs/heads/}"
      if [[ "$tracked_branch" == "$branch" ]]; then
        break
      fi
      worktree_path=""
      ;;
  esac
done < <(git worktree list --porcelain 2>/dev/null || true)

if [[ -z "$worktree_path" ]]; then
  echo "No worktree found for branch '$branch'."
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "Deleting local branch '$branch' only."
    if $force_branch; then
      git branch -D "$branch"
    else
      git branch -d "$branch" || {
        echo "Branch is not fully merged. Re-run with --force-branch to delete it." >&2
        exit 1
      }
    fi
    echo "Done."
    exit 0
  fi
  echo "Nothing to clean up."
  exit 0
fi

if [[ "$worktree_path" == "$repo_root" ]]; then
  echo "Branch '$branch' is checked out in the main worktree at '$repo_root'." >&2
  echo "This script only removes linked PR worktrees under the wtp base directory." >&2
  exit 1
fi

if command -v wtp >/dev/null 2>&1; then
  wtp_args=(remove)
  if $force_worktree; then
    wtp_args+=(--force)
  fi
  if $force_branch; then
    wtp_args+=(--with-branch --force-branch)
  else
    wtp_args+=(--with-branch)
  fi
  wtp_args+=("$branch")
  echo "Running: wtp ${wtp_args[*]}"
  wtp "${wtp_args[@]}"
  echo "Removed worktree and branch '$branch'."
  exit 0
fi

echo "wtp not found; falling back to git worktree commands."

remove_args=(worktree remove)
if $force_worktree; then
  remove_args+=(--force)
fi
remove_args+=("$worktree_path")
git "${remove_args[@]}"

if git show-ref --verify --quiet "refs/heads/$branch"; then
  if $force_branch; then
    git branch -D "$branch"
  else
    git branch -d "$branch" || {
      echo "Branch is not fully merged. Re-run with --force-branch to delete it." >&2
      exit 1
    }
  fi
fi

echo "Removed worktree at '$worktree_path' and branch '$branch'."
