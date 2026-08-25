---
name: ci-worktree
description: Worktree-first branch workflow using wtp (Worktree Plus) — mandatory preflight before first edit, create/reuse worktrees for every new branch, hard stop in primary checkout. Use when starting new work, implementing issues/plans, creating a branch, opening a worktree, or when the user mentions wtp, worktree, or worktrees. Extends engineering.
---

# CI — Worktree

Every new branch lives in its own worktree. Prefer `wtp` over raw `git worktree` when available. **Never implement branch-worthy work in the primary checkout** unless the user explicitly waives the requirement.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Hard gate (non-negotiable)

Run this **before the first file edit** on branch-worthy work — including after plan approval, issue links, or "implement the plan":

1. **Detect checkout type** (see below).
2. If **primary checkout** → create or reuse a worktree → print absolute path → **stop** (no edits, commits, or pushes in primary).
3. If **linked worktree on the wrong branch** → create/switch to the correct worktree → **stop** until the user opens it.
4. If **linked worktree on the correct branch** → proceed.

Waivers require explicit user text: **work in place**, **skip worktree**, or **stay in this checkout**. Plan approval alone is **not** a waiver.

## When a worktree is required

| Required | Skip (work in place) |
|---|---|
| New branch for feature, fix, chore, hotfix, devops, or release work | User explicitly waives (phrases above) |
| Implementing a GitHub issue, plan, or PR-scoped task | Read-only Q&A, review-only, or planning with no file writes |
| Any task expected to produce commits | Already in the **correct linked worktree** for that branch |
| Resuming work — reuse existing worktree for that branch | Trivial one-line fix **and** user waived worktree |

## Detect checkout type

From the repository root (or report `not a git repo`):

```bash
# Linked worktree: .git is a file. Primary checkout: .git is a directory.
if [ -f .git ]; then echo "linked-worktree"; elif [ -d .git ]; then echo "primary-checkout"; else echo "not-a-git-repo"; fi

git branch --show-current
git worktree list
```

Interpretation:

| Signal | Meaning |
|---|---|
| `linked-worktree` | OK to implement **if** `git branch --show-current` matches the task branch |
| `primary-checkout` | **Stop** — create/reuse worktree before any edit |
| Path in `git worktree list` under configured `base_dir` | Dedicated worktree checkout |

Read worktree root from repo `.wtp.yml` `defaults.base_dir` when present (project `AGENT.md` may restate it).

## Preflight

1. Confirm `wtp` is available (`wtp --version`). If missing, use **Fallback** below.
2. Run **Detect checkout type**. If primary checkout → do not edit; continue to create/reuse only.
3. Run `wtp list` (or `git worktree list`) — reuse an existing worktree for the target branch if present.
4. Read the base branch from the repository-root `AGENT.md` Validate block (do not hardcode).
5. Name the branch: `feature/`, `fix/`, `hotfix/`, `chore/`, `devops/`, `major/`, `minor/`, or `patch/` plus a short slug (e.g. `feature/gamedev-mounted-tabs` for issue #76).

## Create

```bash
# New branch from base
wtp add -b <prefix>/<slug> <base>

# Existing local or remote-tracking branch
wtp add <branch>
```

`wtp` places worktrees under the repo `.wtp.yml` `defaults.base_dir` (often outside the Cursor workspace). Run create/remove/list with elevated shell permissions when the sandbox cannot write outside the workspace.

Do **not** use `git checkout -b` in the primary checkout for new work unless the user waived the worktree requirement.

## Workspace boundary

After create:

1. Resolve the absolute path: `wtp cd <worktree-name>` (or the path printed by `wtp add`).
2. Tell the user to **open that path as the Cursor workspace** before implementation continues.
3. **Stop** in the current session after reporting the path — do not assume the user switched workspaces.
4. Do not assume file edits from the primary checkout will land in the new worktree — agent writes are scoped to the open workspace root.

## Post-create verification

In the new worktree directory (after the user opens it):

1. Confirm project post-create hooks from `.wtp.yml` ran as configured (hooks are project-local, not part of this skill).
2. Run `git status` — copy hooks that overwrite tracked paths (for example `.cursor/`) can leave the tree dirty relative to the new branch tip. Report dirtiness; do not silently commit hook noise.
3. Confirm `git branch --show-current` matches the intended branch.
4. Re-run **Detect checkout type** — must show `linked-worktree`.

## Working inside a worktree

- Run validate commands and commit / PR / push skills from the worktree cwd.
- Diff against the base branch from `AGENT.md`, not against an arbitrary default.
- Keep one concern per worktree/branch; start another worktree for unrelated work.

## Recovery (started in primary checkout by mistake)

If edits were already made in the primary checkout:

1. **Stop** further edits there.
2. Create the worktree + branch (`wtp add -b …`).
3. Move work: `git stash push -u -m "<slug>"` in primary → open worktree → `git stash pop`, **or** commit on a throwaway branch in primary and cherry-pick in the worktree (only with user consent for commits).
4. Confirm `git status` is clean in primary before leaving it dirty without telling the user.

## Cleanup

Only on explicit user request:

```bash
wtp remove <worktree-name>
wtp remove --with-branch <worktree-name>   # also delete the branch
wtp remove -f <worktree-name>              # force dirty — needs explicit consent
```

`--force` / `-f` on a dirty worktree destroys uncommitted work — require clear consent. Prefer `--with-branch` only when the user also wants the branch gone.

### Do not re-add cleanup automation

Cleanup is this skill's responsibility: `wtp remove` on explicit request. Before adding a script, hook, or sibling skill that automates post-merge worktree cleanup, confirm the capability is not already present:

```bash
command gh pr list --state open --search "worktree cleanup in:title"
```

Also check the base branch and the working tree for an existing cleanup script or this skill. If either turns one up, extend it or report the duplicate — never open another PR adding a parallel version. Independent agent sessions each adding their own cleanup script produce stacks of near-identical PRs that conflict with each other and with this skill.

## Fallback (no wtp)

When `wtp` or `.wtp.yml` is absent:

```bash
git fetch origin
git worktree add -b <prefix>/<slug> <absolute-or-relative-dir> <base>
# Then manually apply whatever the project normally needs from the main
# worktree (e.g. copy gitignored secrets such as .env).
```

Remove with `git worktree remove <path>` (and delete the branch separately if requested).

## Troubleshooting

| Symptom | Action |
|---|---|
| Branch already checked out elsewhere | Reuse that worktree, or remove/move the other checkout first |
| Stale worktree entries after deleted dirs | `git worktree prune` |
| `wtp remove` name unclear for slashed branches | Use the directory name from `wtp list` / `git worktree list` |
| Hooks left tracked files modified | Inspect `git status` / diff; restore or commit only with user intent |
| User approved plan but workspace is primary | Create worktree, report path, stop — plan approval is not a waiver |
| Agent edited primary before preflight | Follow **Recovery**; do not continue editing in primary |
