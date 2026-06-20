# Posting a Review on the Open PR

When the user asks to review **the PR** (or tier is **pr** with an open PR), split delivery:

| Where | What |
|---|---|
| **Agent chat only** | Full findings table, counts, lint/build detail, verdict rationale |
| **GitHub PR review** | One review submission: **brief body** + **inline comments** on each finding's file/line |

Do **not** put the findings table (or duplicate finding prose) in the PR review body.

## 1. Resolve the current open PR

Use the PR for the **checked-out branch** — never guess a number.

```bash
GH_PAGER=cat gh pr view --json number,url,title,state,headRefOid
```

| Result | Action |
|---|---|
| PR found (`state: OPEN`) | Use `number`, `url`, `headRefOid` |
| No PR | Chat only; tell the user no open PR exists for this branch |
| PR closed/merged | Chat only; do not post |

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

## 2. Chat first — table stays here

Complete the review and show the unified findings table **only in chat** (see reviewer `## Output`). GitHub gets inline threads, not this table.

## 3. One submission — no duplicates

Post **exactly one** pull request review per review pass.

| Forbidden | Why |
|---|---|
| `gh pr comment` **and** `gh pr review` for the same pass | Double post |
| Findings table in the review body | Belongs in chat only |
| Separate summary review after inline comments | One submission only |
| Submitting before all inline comments are attached | Use pending review flow |

### Preferred flow (pending review — gh or GitHub MCP)

1. **Create** a pending review (no `event` yet).
2. **Add** one inline comment per finding (see §4).
3. **Submit once** with a brief body + `event`.

**gh CLI:**

```bash
# 1. pending — gh api POST .../pulls/PR/reviews with commit_id, no event
# 2. each inline — gh api POST .../pulls/PR/comments with path, line, body, commit_id
# 3. submit — gh api POST .../pulls/PR/reviews/REVIEW_ID/events with body + event
```

**GitHub MCP (when `gh` is unavailable):**

1. `pull_request_review_write` — `method: create`, `commitID: headRefOid`
2. `add_comment_to_pending_review` — once per finding (`path`, `line`, `body`, `side: RIGHT`)
3. `pull_request_review_write` — `method: submit_pending`, brief `body`, `event`

### Alternative: single REST call

One `POST .../pulls/{pr}/reviews` with `commit_id`, `event`, short `body`, and `comments` JSON array — **no** separate summary step.

## 4. Inline comments — one per finding

Every finding with a resolvable `path` gets an inline review comment on the PR diff.

**Comment body format:**

```markdown
**{Severity}** ({Source}) — {one-sentence finding}
```

Example:

```markdown
**High** (Convention) — Biome fails on this file (`useImportType`, import order); breaks repo-wide `npm run lint` and CI.
```

**Line resolution:**

- `line` must exist on the **PR diff** for `headRefOid` (right/new side).
- Read the diff or PR files API to pick a line inside the changed hunk — do not guess from local-only context.
- If the file is not in the PR diff, or no valid line exists: **chat only** — note "not posted inline" in chat; do not dump it into the review body.

Prefer line-level comments (`subjectType: LINE`). Use file-level only when the finding applies to the whole file and no hunk line fits.

## 5. Review body — brief summary only

The submitted review body is **2–4 lines max** — verdict, lint/build, pointer to inline threads. **No table.**

**Failed review:**

```markdown
**Verdict:** Review failed
**Lint/build:** lint fail · build pass
**Inline:** {N} review comment(s) on changed files — details in threads.
```

**Passed review:**

```markdown
**Verdict:** Review passed
**Lint/build:** lint pass · build pass
```

**Informational only:** use `COMMENT` event with the same brief format.

## 6. Review event

| Verdict | Event |
|---|---|
| Review passed (zero findings, lint+build pass) | `APPROVE` |
| Review failed | `REQUEST_CHANGES` |
| Notes only | `COMMENT` |

**Own PR:** GitHub blocks `REQUEST_CHANGES` on your own pull request. Use `COMMENT` for the event; inline finding comments still post normally. Record the intended verdict in chat.

## 7. After posting

Reply in chat with:

- PR URL
- Event used (`APPROVE` / `COMMENT` / `REQUEST_CHANGES`)
- Count of inline comments posted vs findings kept chat-only

Do **not** commit, push, or resolve existing threads (that is `pr-resolver`).

## 8. Replying to existing threads

For **existing** review threads (not a new review), use `code/review/pr-resolver/references/graphql-fetch.md`.
