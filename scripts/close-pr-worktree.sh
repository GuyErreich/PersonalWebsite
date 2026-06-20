#!/usr/bin/env bash
# Remove a merged PR branch worktree (wtp-managed or plain git worktree).
set -euo pipefail

branch="${1:-${GITHUB_HEAD_REF:-${HEAD_BRANCH:-}}}"

if [[ -z "$branch" ]]; then
  echo "Usage: $0 <branch-name>" >&2
  echo "  or set GITHUB_HEAD_REF / HEAD_BRANCH" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

worktree_exists=false

if command -v wtp >/dev/null 2>&1; then
  if wtp list 2>/dev/null | awk 'NR > 2 { print $2 }' | grep -Fxq "$branch"; then
    worktree_exists=true
    echo "Removing wtp worktree and branch: $branch"
    wtp remove --with-branch "$branch"
    echo "Done."
    exit 0
  fi
fi

while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  worktree_exists=true
  echo "Removing git worktree: $path (branch $branch)"
  git worktree remove "$path" --force
done < <(
  git worktree list --porcelain |
    awk -v target="refs/heads/$branch" '
      /^worktree / { path = $2 }
      /^branch / && $2 == target { print path }
    '
)

if git show-ref --verify --quiet "refs/heads/$branch"; then
  echo "Deleting local branch: $branch"
  git branch -d "$branch" 2>/dev/null || git branch -D "$branch"
fi

if [[ "$worktree_exists" == false ]]; then
  echo "No worktree found for branch '$branch' (already clean)."
fi

echo "Cleanup complete for $branch."
