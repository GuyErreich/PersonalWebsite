---
description: "Use when: asked to read, resolve, or address PR review comments or conversations"
applyTo: "**"
---

# PR Review Conversation Workflow

Follow this exact sequence whenever resolving Copilot or human review comments on a PR.

---

## Step 1 — Fetch ALL threads (mandatory, every session)

**Always** use the GraphQL API directly — the MCP REST tool uses cursor-based pagination and its `page` parameter **does not advance the cursor**, so you will silently miss threads beyond page 1.

> **Critical:** The MCP tool `mcp_io_github_git_pull_request_read` returns at most 100 threads and its `totalCount` field reveals whether more exist. If `totalCount > 100`, you **must** paginate via GraphQL as shown below.

### Fetch page 1 (always)

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
            nodes { body author { login } url }
          }
        }
      }
    }
  }
}' -f owner=OWNER -f repo=REPO -F pr=PR_NUMBER
```

Inspect `totalCount` and `pageInfo.hasNextPage`. If `hasNextPage` is `true`, repeat with `-f after=<endCursor>` until `hasNextPage` is `false`.

### Filter for unresolved threads (run after collecting all pages)

```python
import json

# Replace with your actual response data (list of `nodes` arrays from each page)
all_nodes = []  # accumulate nodes from all GraphQL pages here

unresolved = [n for n in all_nodes if not n["isResolved"]]

print(f"Total nodes seen: {len(all_nodes)}  Unresolved: {len(unresolved)}")
for n in unresolved:
    print("---")
    print(f"ID  : {n['id']}")
    print(f"File: {n['path']} line {n['line']}")
    for c in n["comments"]["nodes"]:
        print(f"Author: {c['author']['login']}")
        print(f"URL   : {c['url']}")
        print(f"Body  : {c['body'][:300]}")
```

Work through **every** item in `unresolved`. Do not skip threads that seem minor — resolve them all.

---

## Step 2 — Fix each thread

For every unresolved thread:

1. Read the flagged file at the reported line (± 10 lines of context).
2. Understand what the reviewer flagged — semantic issue, style, missing guard, etc.
3. Apply the minimal fix that addresses the root cause. Do not refactor beyond what was asked.

Common category → fix mapping:

| Category                                                        | Correct fix                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| Hardcoded IDs (e.g., SVG filter IDs) colliding across instances | `useId()` — one import, one call, reference in all JSX               |
| `<div onClick>` non-semantic interactive element                | `<button type="button" aria-label="...">`                            |
| Missing `aria-label` on icon-only button                        | Add `aria-label` prop                                                |
| AudioContext not closed / memory leak                           | Call `ctx.close()` in cleanup, handle the returned Promise           |
| `React.createRef<any>()`                                        | Replace with `React.createRef<ConcreteType>()`                       |
| Unhandled `.play()` Promise                                     | `void videoRef.current.play().catch(() => {})`                       |
| Supabase call missing error check                               | Check `error` field; surface with `setError(error.message); return;` |
| Hook declared after useFrame / useEffect that references it     | Move the `useRef`/`useState` declaration above the hook that uses it |
| docstring / comment inaccurate                                  | Fix the description to match the actual values                       |
| Cross-field validation gap (e.g., MIME/extension pair mismatch) | Model pair constraints explicitly (e.g., `mimeTypeExtensions` map); validate pairs together, not independently |
| Server/client contract drift (e.g., upload policies)             | Use MIME→extensions mapping in both client and server; keep duplication notice & link comments in sync |

---

## Step 3 — Validate

After all fixes are applied, always run both commands and confirm zero errors:

```bash
npm run lint   # 0 errors (known fast-refresh warnings in IrisTransition.tsx and SectionEntranceOverlay.tsx are acceptable)
npm run build  # tsc -b + vite build must succeed
```

If either fails, fix the error before proceeding.

---

## Step 4 — Commit and push

**This is mandatory.** GitHub PR threads stay open until the fixed code is pushed — local changes are invisible to reviewers and CI.

```bash
git add -A
git commit -m "fix: address PR review comments"
git push
```

---

## Step 4B — Resolve comments with explanations (optional, when fix is not implemented)

For threads that describe **valid concerns but intentionally not fixed** (e.g., out of scope, working as designed, or deferred to future work):

1. Leave a **reply on the same review thread** (sub-comment), not a top-level PR comment.
2. Include clear reasoning: "This is intentional because…", "Deferring to follow-up PR…", "Not applicable because…", etc.
3. Use the comment URL from the thread to post your reply via GitHub CLI or UI.

### Posting a thread reply (sub-comment)

Use the review comment's numeric ID (`databaseId`) and reply directly to it.

Example (MCP):
```json
{
  "owner": "OWNER",
  "repo": "REPO",
  "pullNumber": PR_NUMBER,
  "commentId": COMMENT_DATABASE_ID,
  "body": "This is intentional because ..."
}
```

Example (GraphQL via gh):
```bash
GH_PAGER=cat gh api graphql --raw-field query='mutation($id:ID!,$body:String!){addPullRequestReviewComment(input:{inReplyTo:$id,body:$body}){comment{id}}}' --raw-field id="REVIEW_COMMENT_NODE_ID" --raw-field body="This is intentional because ..."
```

Example (via CLI):
```bash
# Reply in-thread to a specific review comment on the PR (via MCP helper)
# mcp_io_github_git_add_reply_to_pull_request_comment with commentId=<databaseId>
```

Then resolve the thread normally (Step 5) after posting the explanation.

---

## Step 5 — Resolve threads in GitHub UI via GraphQL

After pushing, resolve every fixed thread programmatically so the PR dashboard reflects reality immediately. Do **not** wait for GitHub to auto-detect — it often doesn't for Copilot-posted threads.

### Get the GraphQL node ID for each thread

The filter above prints the `id` for each thread directly from the GraphQL response. If you need to re-fetch, use the paginated query from Step 1.

### Resolve each thread

> **Always prefix `gh api graphql` calls with `GH_PAGER=cat`** to prevent the pager from opening an alternate buffer and hanging the terminal.

```bash
GH_PAGER=cat gh api graphql --raw-field query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{id isResolved}}}' --raw-field t="THREAD_NODE_ID"
```

Repeat for every thread that has been fixed. Threads whose code fix is already pushed should be resolved immediately.

### Batch-resolve multiple threads (shell loop)

```bash
for id in "THREAD_ID_1" "THREAD_ID_2" "THREAD_ID_3"; do
  GH_PAGER=cat gh api graphql --raw-field query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' --raw-field t="$id"
done
```

---

## Step 6 — Verify completeness

Re-run the MCP fetch + Python filter from Step 1. The unresolved count must be 0. If any remain, fix and resolve them before declaring done.

> **Note:** Threads flagged by GitHub Advanced Security (CodeQL) do not resolve via the GraphQL mutation — they require CodeQL to re-scan. If a thread persists after a re-scan, dismiss it on the Security tab with a written rationale.

---

## Notes

- **Always re-fetch at session start** — threads accumulate between sessions; never assume the list is the same as last time.
- **Use GraphQL, not the MCP REST tool, for full pagination.** The MCP tool returns at most 100 threads, and its `page` parameter does not advance the cursor — calling it with `page=2` returns the same first 100 threads. Always check `totalCount`; if it exceeds 100, paginate via GraphQL using `after: <endCursor>`.
- **Always set `GH_PAGER=cat`** before any `gh api graphql` call — without it, `gh` opens a pager (less/bat) in an alternate buffer that hangs the terminal and requires manual exit.
- The Python/GraphQL filter is the only reliable way to enumerate unresolved threads. Text grep on `html_url` misses threads added after the last fetch.
- Do not rely on a PR's "resolved" badge in the UI — fetch programmatically and filter `isResolved: false`.
- Use `includeIgnoredFiles: true` in grep searches when looking inside `.github/` or other gitignore-adjacent paths.
- **Local changes do not resolve threads.** GitHub evaluates the pushed branch. Always commit and push before resolving.
- **CI env vars:** If a build step requires env vars that are set as repo secrets, reference them as `${{ secrets.VAR_NAME }}` — the same pattern used in `deploy.yml`. Never use hardcoded placeholder values when the real secrets are already available.
- **Explaining skipped fixes:** If a reviewer raises a valid concern that you intentionally don't fix (out of scope, design decision, working as intended), post an explanatory comment on the thread **before** resolving it. This keeps context in the PR history and prevents re-raising the same concern in future reviews.
- **AI reviewer insights:** The review tables and mappings above capture patterns learned from prior PR reviews on this codebase. When encountering new categories of issues, consider updating the table to help future reviews catch the same class of problems earlier.
