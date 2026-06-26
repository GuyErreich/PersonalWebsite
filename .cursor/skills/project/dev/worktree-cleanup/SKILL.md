---
name: worktree-cleanup
description: Remove a merged or closed PR branch worktree on the local machine using wtp or git worktree. Use when a PR closes or merges and the prompt asks to clean up the branch worktree.
disable-model-invocation: true
---

# PR Worktree Cleanup

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Requirements

- **Run locally** on the developer machine — cloud agents cannot access `../worktrees/PersonalWebsite`.
- **Run from the main repository checkout**, not from the PR worktree being removed.
- **Execute immediately** — do not add scripts, docs, or PRs unless the cleanup script is missing from the repo.

## Workflow

1. Resolve the branch name from the PR event (`headRefName`) or PR number.
2. From the repo root, run:

```bash
./scripts/close-pr-worktree.sh <headRefName>
```

Or with a PR number:

```bash
./scripts/close-pr-worktree.sh <pr-number>
```

3. If `wtp` is available and the script fails, retry directly:

```bash
wtp remove --with-branch <headRefName>
```

4. Verify cleanup:

```bash
wtp list
git worktree list
git branch | grep <headRefName> || true
```

## Rules

- Idempotent: "already clean" is success.
- Do not delete the main worktree (`@` / repo root).
- Worktrees live under `../worktrees/PersonalWebsite` per `.wtp.yml`.
- Remote branch deletion is handled by GitHub; this skill only cleans local worktree + local branch.

## Stop conditions

- Stop after the script exits 0 and verification shows no local worktree or branch for the PR head ref.
- Report clearly if running in a cloud sandbox with no local worktrees (cannot complete cleanup from that environment).
