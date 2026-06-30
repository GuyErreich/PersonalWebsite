---
name: reviewer
description: Single-pass code reviewer — engineering Phase 0 plus domain, logic, and threat passes routed by changed files. Posts on the open PR via gh when reviewing the PR. No subagents. Use before commit, PR open, push, or manual self-review (see code-review-gate rule). Extends engineering.
disable-model-invocation: true
---

# Code Reviewer

Systematically reviews changed code in one pass. Routes to skills by what the diff touches, reads the project's `AGENT.md` chain for local conventions, and reports one unified findings table. Designed to catch what a general reviewer misses: foundations violations, reuse gaps, domain resource handling, and project-specific contracts.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first — Phase 0 runs its checks on every tier before any domain phase.

## Review surface (always materialize all of it)

1. **Tier diff** — see `references/tiers-and-scope.md` for the git scope of each tier (`change` / `commit` / `pr` / file argument).
2. **Full branch for PR tier** — prefer `merge-base...HEAD`; warn if asked to review a narrower scope than the milestone needs.
3. **AGENT.md chain** — for every changed path, read the nearest `AGENT.md` walking up to the repo root, and apply that guidance.
4. **Skill routing** — map changed files to skills (table below) and load only what matches.

## File → skill routing

| Signal | Load |
|---|---|
| any code file | **engineering** (Phase 0, always) |
| `*.{ts,tsx,js,mjs}` | + `code/languages/nodejs` |
| `*.{tsx,jsx}` components/pages | + `code/web/libs/react`, `code/web/ui`, `code/web/ux` |
| `**/three/**`, shaders | + `code/web/libs/threejs`, `code/quality/performance` |
| effects/timers/listeners/audio/GPU | + `code/quality/performance` |
| auth / input / data / secrets | + `code/quality/security` |
| GSAP / animation libraries | + `code/web/libs/react` (gsap-patterns reference) |
| project backend (supabase) | + `project/platform/supabase` (if present) |

Load a skill only when the diff matches; load its references only if that phase surfaces an issue.

## Phases (single pass, no subagents)

| Phase | Pass | Source skill |
|---|---|---|
| 0 | Engineering | `engineering` (duplication, typing intent, naming, structure, SoC, coupling) |
| 1 | Language / lint | `code/languages/nodejs` |
| 2 | React structure | `code/web/libs/react` |
| 3 | UI / a11y | `code/web/ui` |
| 3b | UX / interactivity | `code/web/ux` (press, dismiss, motion, reduced motion, library fit) |
| 4 | Performance / memory | `code/quality/performance` |
| 5 | Security | `code/quality/security` |
| 6 | Domain | `threejs`, project skills — only if paths match |
| 7 | Logic & regression | `references/logic-pass.md` (Bugbot-style) |
| 8 | Threat model | `references/threat-pass.md` (Security-Review-style) |
| 9 | Validate | run the project's lint + build commands from the repo `AGENT.md` |

Run all phases in one session. Do not fix findings unless the user explicitly asked. If there is no diff at all, report one sentence and stop.

## PR tier — post on the open PR

When the user asks to review **the PR**, or tier is **pr** and they want feedback on GitHub:

1. Complete the review and output the **full findings table in chat only** (below).
2. Load `references/pr-comments.md` and post **one** review on the current branch's open PR:
   - Resolve PR with `gh pr view` (or GitHub MCP equivalent).
   - Add an **inline review comment on each finding's file/line** (verify line is on the PR diff).
   - Submit **once** with a **brief** review body (verdict + lint/build + inline count) — **never** the findings table.
3. If there is no open PR, report in chat only.

Do not commit, push, or resolve existing threads — that is `pr-resolver`.

## Lockfile protocol (optional advisory)

If the repo provides a review-dedup helper, the gate rule may use it to skip a re-scan when the tree is unchanged. Treat it as advisory, not a hard gate. See `references/tiers-and-scope.md`.

## Output

Produce one unified findings table:

| Severity | Source | Location (file:line) | Finding |
|---|---|---|---|

- **Severity** — `Critical`, `High`, `Medium`, `Low` (highest first).
- **Source** — `Engineering`, `Convention (Phase N)`, `Logic`, or `Security`.
- **Location** — `path:line` (line optional).
- **Finding** — one concise sentence.

Deduplicate overlapping findings into one row with a combined source. After the table, give: lint/build pass or fail, counts per source, and a one-line verdict — **Review passed** (zero findings, lint+build pass) or **Review failed** (any finding or lint/build failure).

**Chat only** — do not copy this table to GitHub. On PR tier, post findings as inline review comments; see `references/pr-comments.md`.
