---
name: ci-pr
description: Pull-request creation workflow — review at PR tier, assign the authenticated user, link related issues for Development sidebar auto-close, then open the PR with the standard body template. Use when the user asks to create or open a PR. Extends engineering.
disable-model-invocation: true
---

# CI — Pull Request

The milestone workflow for opening a pull request.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## GitHub CLI in agent shells

Invoke the CLI as **`command gh`**, never bare `gh`. Interactive shells often alias `gh` to a credential-manager wrapper — for example 1Password's `alias gh="op plugin run -- gh"` — and those wrappers fail in agent shells where the helper daemon cannot start:

```
couldn't start daemon: open /run/user/1000/op-daemon.pid: no such file or directory
[ERROR] Shell Plugins can only be used with the 1Password app integration enabled.
```

This hits **every** subcommand and flag combination, and reads like an auth or flag-support problem rather than an alias problem — do not conclude that a flag such as `--json` is unsupported. `command gh` bypasses the alias and behaves identically on machines with no alias, so prefer it unconditionally. Only if `command gh auth status` itself fails should you fall back to the GitHub MCP server.

## Workflow

1. **Understand the full branch.** Inspect status, the full diff since the branch diverged from the base, and the commit history — not just the latest commit.
2. **Review at PR tier.** Run the reviewer (tier: pr, `merge-base...HEAD`). Require a clean verdict or an explicit skip before opening the PR.
3. **Ensure the branch is pushed.** Opening a PR requires the branch on the remote — but pushing requires explicit push consent (see `git-push-consent.mdc` and the push skill). Ask before pushing if needed.
4. **If the work is tied to an issue**, load `references/issue-linking.md` and apply its body keyword + assignee steps before create.
5. **Open the PR** with `--assignee @me` and a body filled from `assets/pr-body.md` (or the repo `.github/PULL_REQUEST_TEMPLATE.md` when present). Prefer HEREDOC or `--body-file`. Omit the **Related issue** section when there is no issue — never leave a bare `Closes #`.
6. **Verify** assignees and URL:

```bash
command gh pr view --json assignees,url
```

Return the PR URL when done.

## Body template

Use `assets/pr-body.md`. Structure:

```
## Summary
- <1-3 bullet points on what changed and why>

## Related issue
Closes #<number>

## Test plan
- [ ] <how to verify>

## Notes
<optional: breaking changes, follow-ups; omit section if empty>
```

Write complete sentences. Reflect all commits in the branch, not only the most recent.

## When to load references

| Topic | Reference |
|---|---|
| Link PR to issue (Development sidebar, auto-close, assignees) | `references/issue-linking.md` |
