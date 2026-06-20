---
name: ci-commit
description: Commit workflow — confirm consent, run the reviewer at change tier in a loop until clean or skipped, then write a conventional message and commit. Use when the user asks to commit. Extends engineering.
disable-model-invocation: true
---

# CI — Commit

The milestone workflow for creating a commit. Review before committing; never commit without explicit user intent.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Workflow

1. **Confirm consent.** Only commit when the user explicitly asked to commit (see `.cursor/rules/behaviors/git-commit-consent.mdc`). **Exception:** pr-resolver scoped consent when executing an approved fix plan — see pr-resolver `## Scoped consent`.
2. **Optional dedup.** If the repo provides the review-lock helper, `check change`; skip the scan if the tree is already reviewed.
3. **Review at change tier.** Run `.cursor/skills/code/review/reviewer/SKILL.md` (tier: change). If findings exist, run the local review loop (`.cursor/skills/code/ci/local-review-loop/SKILL.md`) until the verdict is clean or the user explicitly skips. Record the verdict if using the lockfile.
4. **Draft the message.** Imperative mood, focused on the why. Use `add` for new features, `update` for enhancements, `fix` for bug fixes. Pass multi-line messages via a HEREDOC.
5. **Commit** only after the review passed or was explicitly skipped. Do not stage files that may contain secrets (`.env`, credentials, local MCP config); warn if the user asks to.
6. **Verify** with `git status` after the commit.
7. **Do not push** unless pr-resolver Step 6 applies. General pushes need separate explicit consent (`.cursor/rules/behaviors/git-push-consent.mdc`).

## Message format

```bash
git commit -m "$(cat <<'EOF'
Concise imperative summary.

Optional body explaining the why.
EOF
)"
```

If a commit fails (for example a pre-commit check rejects it), fix the issue and create a new commit — do not amend a rejected commit.
