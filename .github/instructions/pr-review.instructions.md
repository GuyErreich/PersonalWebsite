---
description: "Use when: asked to read, resolve, or address PR review comments or conversations"
applyTo: "**"
---

# PR Review Conversation Workflow

Follow this exact sequence whenever resolving Copilot or human review comments on a PR.

---

## Step 1 — Fetch ALL threads (mandatory, every session)

**Always** call the MCP tool at the start of every PR session — never rely on previously cached data. New threads can appear at any time.

```
mcp_io_github_git_pull_request_read  method=get_review_comments  owner=...  repo=...  pullNumber=...  perPage=100
```

The result is written to a file. Immediately filter it with Python to get a definitive list:

```python
import json

with open("<path from tool output>") as f:
    data = json.load(f)

threads = data.get("review_threads", [])
unresolved = [t for t in threads if not t.get("is_resolved", True)]

print(f"Total: {len(threads)}  Unresolved: {len(unresolved)}")
for t in unresolved:
    c = t["comments"][0]
    print("---")
    print(f"URL : {c.get('html_url')}")
    print(f"File: {c.get('path')} line {c.get('line', '?')}")
    print(f"Body: {c.get('body', '')[:200]}")
    # node_id needed later to resolve the thread in GitHub UI:
    print(f"node_id: {t.get('id', '')}")
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

## Step 5 — Resolve threads in GitHub UI via GraphQL

After pushing, resolve every fixed thread programmatically so the PR dashboard reflects reality immediately. Do **not** wait for GitHub to auto-detect — it often doesn't for Copilot-posted threads.

### Get the GraphQL node ID for each thread

The Python filter above prints `node_id` for each thread. If you need to re-fetch them:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes { id isResolved path line }
        }
      }
    }
  }
' -f owner=OWNER -f repo=REPO -F pr=PR_NUMBER
```

### Resolve each thread

```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread { id isResolved }
    }
  }
' -f threadId="THREAD_NODE_ID"
```

Repeat for every thread that has been fixed. Threads whose code fix is already pushed should be resolved immediately.

### Batch-resolve multiple threads (shell loop)

```bash
for id in "THREAD_ID_1" "THREAD_ID_2" "THREAD_ID_3"; do
  gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -f t="$id"
done
```

---

## Step 6 — Verify completeness

Re-run the MCP fetch + Python filter from Step 1. The unresolved count must be 0. If any remain, fix and resolve them before declaring done.

> **Note:** Threads flagged by GitHub Advanced Security (CodeQL) do not resolve via the GraphQL mutation — they require CodeQL to re-scan. If a thread persists after a re-scan, dismiss it on the Security tab with a written rationale.

---

## Notes

- **Always re-fetch at session start** — threads accumulate between sessions; never assume the list is the same as last time.
- Always use `perPage: 100` — the default is often 30 and you will miss threads.
- The Python filter is the only reliable way to enumerate unresolved threads. Text grep on `html_url` misses threads added after the last fetch.
- Do not rely on a PR's "resolved" badge in the UI — fetch programmatically and filter `is_resolved: false`.
- Use `includeIgnoredFiles: true` in grep searches when looking inside `.github/` or other gitignore-adjacent paths.
- **Local changes do not resolve threads.** GitHub evaluates the pushed branch. Always commit and push before resolving.
