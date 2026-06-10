---
name: pr-review
description: Resolves GitHub PR review threads by fetching all comments via GraphQL, applying minimal fixes, validating lint/build, pushing, and posting threaded replies. Use when asked to read, resolve, or address PR review comments or conversations.
disable-model-invocation: true
---

# PR Review Conversation Workflow

Follow this exact sequence whenever resolving Copilot or human review comments on a PR.

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

Every thread must end as: fixed in code, intentionally not fixed (with in-thread explanation), or blocked (blocker reported).

## Step 2 — Fix each thread

1. Read flagged file at reported line (±10 lines).
2. Fix real bugs, regressions, safety, or maintainability issues with minimal root-cause changes.
3. Do not change code for false positives or out-of-scope suggestions — reply in-thread instead.

| Category | Fix |
|---|---|
| Hardcoded SVG filter IDs | `useId()` |
| `<div onClick>` | `<button type="button" aria-label="...">` |
| Missing `aria-label` | Add prop |
| AudioContext leak | `ctx.close()` in cleanup |
| Supabase missing error check | Check `error`; `setError(error.message); return;` |
| Hook declared after useFrame | Move declaration above |

## Step 3 — Validate

```bash
npm run lint   # 0 errors
npm run build  # must succeed
```

## Step 4 — Commit, push, reply (mandatory)

Local changes do not resolve threads. Always push before resolving.

```bash
git add -A
git commit -m "fix: address PR review comments"
git push
```

Post a threaded reply on **every** resolved thread:

- Fixed: "Fixed in \<commit\>. \<one-sentence summary\>."
- Not fixed: "Not fixed. \<reason\>."
- Blocked: "Blocked by \<reason\>."

```bash
GH_PAGER=cat gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_DATABASE_ID/replies \
  -f body="Fixed in abc1234. ..."
```

## Step 5 — Resolve threads

```bash
GH_PAGER=cat gh api graphql --raw-field query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' --raw-field t="THREAD_NODE_ID"
```

## Step 6 — Verify & summarize

Re-fetch; unresolved count must be 0. Report per-thread: file, line, fixed/not fixed, rationale, commit SHA, reply posted.

Load `.cursor/skills/review/code-review/SKILL.md` for the code inspection step that precedes this workflow.
