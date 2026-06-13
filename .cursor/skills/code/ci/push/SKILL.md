---
name: ci-push
description: Push workflow — require explicit consent, review at PR tier, and if an open PR has unresolved review threads, hand off to pr-resolver. Use when the user asks to push. Extends engineering.
disable-model-invocation: true
---

# CI — Push

The milestone workflow for pushing to the remote.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## Workflow

1. **Require explicit push consent.** Never push without it (see `.cursor/rules/behaviors/git-push-consent.mdc`). Approving a plan, asking to commit, or finishing fixes does not count.
2. **Review at PR tier.** Run the reviewer (tier: pr). Require a clean verdict or an explicit skip.
3. **Check for an open PR** on the current branch:

```bash
gh pr view --json number,url,state 2>/dev/null
```

4. **If an open PR exists**, fetch its review threads (see `code/review/pr-resolver` graphql reference). If there are unresolved human/bot threads, stop and recommend running the pr-resolver loop before pushing more changes.
5. **If no open PR** (or no unresolved threads) and the local review passed, push.

```bash
git push        # only after explicit consent and a clean/again-skipped review
```

Never force-push to a shared branch without an explicit request, and warn before any force-push to a protected branch.
