---
name: pr-resolver
description: Controlled loop that resolves GitHub PR review threads — review, post findings, fetch threads, Plan-mode triage table, implement only approved fixes, re-review until clean. No auto commit or push. Use to read, resolve, or address PR review comments. Extends engineering.
disable-model-invocation: true
---

# PR Resolver

A controlled loop for resolving Copilot or human review comments on a pull request. Runs the reviewer, triages every thread with the user in Plan mode, fixes only what is approved, and repeats until no unresolved issues remain — without ever committing or pushing on its own.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first. Load `.cursor/skills/code/review/reviewer/SKILL.md` when you need project-convention context to judge a thread.

**Hard stop:** Do not edit code, commit, push, post replies, or resolve threads until the user explicitly approves the plan from the triage step.

## Loop

```
reviewer(pr) on the branch diff
  → post review comments for genuine new findings
  → fetch ALL threads (GraphQL — see references/graphql-fetch.md)
  → SwitchMode → plan: present triage table (fix | by design | blocked)
  → wait for explicit user approval
  → implement ONLY approved "fix" rows (minimal, root-cause)
  → validate (lint/build from AGENT.md)
  → post threaded replies; resolve threads per the rules below
  → re-review → repeat until unresolved count is 0
```

## Step 1 — Fetch all threads

Always use GraphQL and paginate fully — REST tooling silently misses threads beyond page one. See `references/graphql-fetch.md` for the query and pagination. Filter to unresolved threads.

## Step 2 — Understand each thread

For every unresolved thread: read the full thread, read the flagged file around the reported line, and summarize what the reviewer wants in plain language. Then classify a **proposed** outcome (do not act yet):

| Outcome | When |
|---|---|
| **Fix** | Real bug, regression, safety issue, or clear maintainability win with a minimal diff |
| **By design** | Intentional trade-off, false positive, stylistic preference, or out-of-scope suggestion |
| **Blocked** | Needs a product/architecture decision, missing context, or an external dependency |

Review suggestions are input, not orders. Keep intentional design as-is when the trade-off was considered and the code is correct.

## Step 3 — Plan mode & approval gate

Switch to Plan mode and present a per-thread table:

```markdown
## PR Resolver Plan — PR #<number>

| # | File:Line | Reviewer | Proposed | Why it fixes / why keep |
|---|---|---|---|---|
| 1 | path:42 | @reviewer | Fix | one-sentence rationale |
| 2 | path:88 | @copilot | By design | one-sentence rationale |
```

Then stop and wait. Do not proceed until the user explicitly approves or revises. If they revise, update the table and wait again.

## Step 4 — Execute approved plan only

Apply only what was approved; follow any user override. Fix threads get minimal root-cause changes. By-design and blocked threads get a prepared in-thread reply, no code change.

## Step 5 — Validate

Run the project's lint and build (see the repo `AGENT.md`) when the approved plan changed code. Skip when there were no code changes.

## Step 6 — Reply & resolve

Post a threaded reply on every approved thread. Resolution rules:

| Outcome | Resolve when |
|---|---|
| Fix (code changed) | only after the fix is on the remote PR branch — which requires explicit push consent and a successful push |
| By design / Blocked (no code change) | after posting the in-thread reply |

If fixes are committed locally but not pushed, leave those threads unresolved and say so. **Never commit or push without explicit user consent** (`git-commit-consent.mdc`, `git-push-consent.mdc`).

## Step 7 — Re-review

Re-run the loop until the unresolved count is 0. Report per thread: file, line, outcome, rationale, commit SHA (if any), reply posted.
