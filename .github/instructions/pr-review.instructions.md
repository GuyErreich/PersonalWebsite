---
description: "Use when: asked to read, resolve, or address PR review comments or conversations"
applyTo: "**"
---

# PR Review Conversation Workflow

Follow this exact sequence whenever resolving Copilot or human review comments on a PR.

---

## Step 1 — Fetch ALL threads

Use the GitHub MCP tool to fetch every review thread in one call. Always request `perPage: 100` so nothing is silently truncated.

```
mcp_io_github_git_pull_request_read  owner=... repo=... pullNumber=...
```

If a separate "list review comments" endpoint is available, prefer it. Store the full response for filtering.

---

## Step 2 — Identify unresolved threads

Filter the response in Python to avoid false positives from text-based grep:

```python
import json, sys
data = json.load(sys.stdin)
unresolved = [t for t in data if not t.get('is_resolved', True)]
for t in unresolved:
    print(t['id'], t.get('path'), t.get('line'), t.get('body', '')[:120])
```

Work through **every** item in `unresolved`. Do not skip threads that seem minor — resolve them all.

---

## Step 3 — Fix each thread

For every unresolved thread:

1. Read the flagged file at the reported line (± 10 lines of context).
2. Understand what the reviewer flagged — semantic issue, style, missing guard, etc.
3. Apply the minimal fix that addresses the root cause. Do not refactor beyond what was asked.
4. Move on — do not mark threads as resolved manually; a passing build is the proof.

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
| docstring / comment inaccurate                                  | Fix the description to match the actual values                       |

---

## Step 4 — Validate

After all fixes are applied, always run both commands and confirm zero errors:

```bash
npm run lint   # 0 errors (known fast-refresh warnings in IrisTransition.tsx and SectionEntranceOverlay.tsx are acceptable)
npm run build  # tsc -b + vite build must succeed
```

If either fails, fix the error before proceeding.

---

## Step 5 — Verify completeness

Re-fetch the thread list and repeat the Python filter. If any unresolved threads remain, address them. Repeat Steps 3–5 until the unresolved list is empty.

---

## Notes

- Always use `perPage: 100` — the default is often 30 and you will miss threads.
- Some Copilot review comments are posted as a batch; fetch the latest review's comments separately if the main thread list appears incomplete.
- Do not rely on a PR's "resolved" badge in the UI — fetch programmatically and filter `is_resolved: false`.
- Use `includeIgnoredFiles: true` in grep searches when looking inside `.github/` or other gitignore-adjacent paths.
