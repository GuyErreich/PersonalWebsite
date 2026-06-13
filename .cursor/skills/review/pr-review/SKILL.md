---
name: pr-review
description: Resolves GitHub PR review threads by fetching comments, understanding each thread, switching to Plan mode for user approval of fix/by-design/blocked triage, then applying approved changes, validating, pushing, and posting threaded replies. Use when asked to read, resolve, or address PR review comments or conversations.
disable-model-invocation: true
---

# PR Review Conversation Workflow

Follow this exact sequence whenever resolving Copilot or human review comments on a PR.

**Hard stop:** Do not edit code, commit, push, post replies, or resolve threads until the user explicitly approves the plan from Step 3.

## Step 1 — Fetch ALL threads (mandatory)

Always use GraphQL — the MCP REST tool paginates incorrectly and silently misses threads beyond page 1.

```bash
GH_PAGER=cat gh api graphql -f query='
query($owner: String!, $repo: String!, $pr: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100, after: $after) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          id isResolved path line
          comments(first: 10) {
            nodes { body author { login } url databaseId }
          }
        }
      }
    }
  }
}' -f owner=OWNER -f repo=REPO -F pr=PR_NUMBER
```

Paginate with `-f after=<endCursor>` until `hasNextPage` is false. Filter `isResolved: false`.

## Step 2 — Understand each thread

For every unresolved thread:

1. Read the full comment thread (not just the latest reply).
2. Read the flagged file at the reported line (±10 lines).
3. Summarize what the reviewer is asking for in plain language.
4. Classify a **proposed** outcome — do not act on it yet:

| Outcome | When |
|---|---|
| **Fix** | Real bug, regression, safety issue, or clear maintainability win with minimal diff |
| **By design** | Intentional trade-off, false positive, stylistic preference, or out-of-scope suggestion |
| **Blocked** | Needs product/architecture decision, missing context, or external dependency |

**Do not treat every comment as a required change.** Review suggestions are input, not orders. Prefer leaving intentional design as-is when the trade-off was considered and the code is correct.

Load `.cursor/skills/review/code-review/SKILL.md` when you need project convention context to judge a thread.

## Step 3 — Plan mode & approval gate (mandatory)

Switch to **Plan mode** before any implementation:

```
SwitchMode → target_mode_id: "plan"
```

Present a per-thread plan using this format:

```markdown
## PR Review Plan — PR #<number>

| # | File:Line | Reviewer | Proposed | Why |
|---|---|---|---|---|
| 1 | `path/to/file.tsx:42` | @reviewer | Fix | One-sentence rationale |
| 2 | `path/to/file.tsx:88` | @copilot | By design | One-sentence rationale |

### Will fix (<n>)
- **Thread 1** — `path:line`: planned change in one sentence

### By design (<n>)
- **Thread 2** — `path:line`: why no code change

### Blocked (<n>)
- **Thread N** — `path:line`: what decision or context is needed

### After approval
- Code changes: yes/no
- Lint + build: if code changes
- Commit and threaded replies if approved
- Push only if user gives separate explicit consent
```

Then **stop and wait**. Do not proceed until the user explicitly approves the plan (e.g. "approved", "go ahead", "looks good") or asks for revisions.

If the user requests changes to the plan, update the table and wait for approval again.

## Step 4 — Execute approved plan only

Apply **only** what the user approved. If they override a proposed outcome, follow their decision.

### Fix threads

Minimal root-cause changes only — no drive-by refactors.

| Category | Fix |
|---|---|
| Hardcoded SVG filter IDs | `useId()` |
| `<div onClick>` | `<button type="button" aria-label="...">` |
| Missing `aria-label` | Add prop |
| AudioContext leak | `ctx.close()` in cleanup |
| Supabase missing error check | Check `error`; `setError(error.message); return;` |
| Hook declared after useFrame | Move declaration above |

### By design threads

Do not change code. Prepare the in-thread reply only.

### Blocked threads

Do not change code unless the user unblocked it during approval. Prepare the in-thread reply only.

## Step 5 — Validate (code changes only)

Skip lint/build when the approved plan had no code changes.

```bash
npm run lint   # 0 errors
npm run build  # must succeed
```

## Step 6 — Commit, reply, push (push only with consent)

Post a threaded reply on **every** approved thread (mandatory). Commit only when Step 4 produced code changes and the user asked for a commit.

**Do not push** unless the user explicitly approves (see `.cursor/rules/git-push-consent.mdc`). After committing, tell them the branch is ready and wait for push consent.

```bash
git add -A
git commit -m "fix: address PR review comments"
# git push — only after explicit user consent
```

Reply templates:

- Fixed: "Fixed in \<commit\>. \<one-sentence summary\>."
- By design: "By design. \<one-sentence rationale\>."
- Blocked: "Blocked by \<reason\>."

```bash
GH_PAGER=cat gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_DATABASE_ID/replies \
  -f body="Fixed in abc1234. ..."
```

## Step 7 — Resolve threads (remote required for fixes)

**Do not resolve fix threads until the remote PR branch contains the fix commits.**

| Plan outcome | When to resolve |
|---|---|
| **Fix** (code changed) | Only after the user gave push consent **and** `git push` succeeded. Verify with `git rev-parse HEAD` vs `git rev-parse @{u}` or compare SHAs on the PR branch. |
| **By design / Blocked** (no code changes) | After posting the in-thread reply. |

If fixes are committed locally but not pushed, leave fix threads **unresolved**, note that in the Step 8 summary, and resolve them only after a successful push.

```bash
GH_PAGER=cat gh api graphql --raw-field query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' --raw-field t="THREAD_NODE_ID"
```

## Step 8 — Verify & summarize

Re-fetch; unresolved count must be 0. Report per-thread: file, line, outcome (fixed / by design / blocked), rationale, commit SHA (if any), reply posted.
