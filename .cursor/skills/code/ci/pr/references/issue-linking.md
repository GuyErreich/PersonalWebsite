# Issue ↔ PR linking

How to connect a pull request to a GitHub issue so it appears under **Development** and closes when the PR merges into the repository **default** branch.

GitHub has **no public API** for the Development sidebar gear. `gh pr edit --add-issue` is not available. Automate with closing keywords and assignees instead.

## Closing keywords (required when an issue exists)

Put one of these in the **PR body** (not only in a commit message if you want the PR listed under Development):

- `Closes #N`
- `Fixes #N`
- `Resolves #N`

Also accepted: `close` / `closed` / `fix` / `fixed` / `resolve` / `resolved`, with optional colon (`Closes: #N`).

Effects when the PR targets the repository **default** branch:

1. The PR appears in the issue **Development** sidebar (in progress while open).
2. Merging the PR into the default branch **closes** the issue.

Cross-repo: `Fixes owner/repo#N`. Multiple issues: repeat the full keyword for each (`Closes #10, closes #11`).

## Assignee on the issue

When opening a PR for an existing issue, ensure the authenticated user is assigned:

```bash
command gh issue edit <n> --add-assignee @me
```

Skip if the issue already lists that assignee. Issue create (`code/ci/issue`) already passes `--assignee @me`.

## Branch link before a PR exists

To show Development “in progress” from a branch (before the PR):

```bash
command gh issue develop <n> --name <current-branch>
```

Use when starting work from an issue (see also `code/ci/worktree`). Full linking details stay in this file.

## Default-branch caveat

Closing keywords **only** auto-link and auto-close when the PR base is the repository default branch.

Before create:

```bash
command gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

Compare to the PR base (from `AGENT.md` Validate / `--base`). If they differ:

1. Still put `Closes #N` in the body (correct when default matches, or when a later PR targets default).
2. Tell the user GitHub will **not** auto-close until the change lands on the default branch, and they can still link via the Development sidebar in the UI.

Do not add a custom close-on-merge Action from this skill unless the user explicitly asks.

## Manual Development sidebar

Anyone with write access can link from the PR or issue **Development** menu on github.com. Prefer keywords for agent automation; fall back to telling the user to use the sidebar when the base is not the default branch and a hard link is required immediately.
