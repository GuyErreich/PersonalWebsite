# Summary Canvas

Closing artifact for a finished (or stopped) PR review loop. Write to:

```
~/.cursor/projects/<workspace>/canvases/pr-<number>-review-loop.canvas.tsx
```

Follow the canvas skill: single `.canvas.tsx`, import only from `cursor/canvas`, embed all data inline, no empty states.

## Data source

Read `.cursor/review-loop/state.json` in full. Optionally run `rtk gain -p -f json` for the savings offset (skip silently if rtk unavailable).

## Required sections

1. **Verdict header** — passed / stopped (escalation | budget | round cap | unchanged) · PR number · branch · rounds run.
2. **Findings by severity and source** — counts table or compact chart. Omit if zero findings total.
3. **Per-round breakdown** — found / fixed / accepted / escalated per round.
4. **Fixes** — each fix: what changed, why, what it improved. One row per fixed finding. Omit section if none.
5. **Accepted by design** — list with rationale. Omit if empty.
6. **Escalations** — list with category, why-it-is-an-issue, orchestrator recommendations (Fix vs By design), and the user’s final choice. Omit if empty.
7. **Lint / build / commit trail** — per-round lint+build and commit SHAs.
8. **Cost panel** (always when any round ran):
   - Estimated tokens per round (input vs output) — labeled chart
   - Loop totals vs `max_tokens_est` / `max_usd_est`
   - Role models used (`reviewer_model` / `fixer_model`) and `pricing_mode`
   - Exact counts kept visually distinct: rounds, turns, tool calls, wall-clock
   - rtk savings offset when available
   - Caption: assumptions (`chars_per_token`, `cached_prefix_discount`, prices dated YYYY-MM) and note that billed figures live in the Cursor dashboard — these are reconstructions

## Chart label example

```
Estimated tokens per round · input vs output · chars/token 3.9 · prices dated 2026-08
```

## After writing

Link the canvas in chat with its absolute path. Set `state.json` `active: false`.
