---
name: code-review
description: Full single-pass review — six convention phases plus inlined logic-bug and threat-model passes. No subagents. Use before commit, PR open, push, or manual self-review (see code-review-gate rule).
disable-model-invocation: true
---

# Code Review Skill

Systematically reviews code in this React + TypeScript + Vite project across **six phases**. Each phase maps to an existing skill — load it only if issues are found in that phase.

This skill is designed to catch what Copilot's general reviewer misses: project-specific conventions, reuse violations, interaction gaps, and domain-specific resource handling.

---

## Scope and tiers

Determine tier before reviewing:

| Tier | When | Git scope |
|---|---|---|
| **change** | Before commit (gate rule) | `git diff HEAD` + `git diff --cached` (uncommitted only) |
| **commit** | After commit or when change tier just passed on identical tree | `git diff HEAD~1..HEAD` (last commit) |
| **pr** | Before push or `gh pr create` (gate rule) | `git diff merge-base...HEAD` (full branch, PR-equivalent) |
| **file argument** | User names a path | That file/area only |

If tier is unclear, ask once. Default manual invocation to **pr** when the user mentions PR or branch review; default to **change** for pre-commit.

List changed files:

```bash
# change
git diff --name-only HEAD && git diff --cached --name-only

# commit
git diff --name-only HEAD~1..HEAD

# pr
git diff --name-only $(git merge-base HEAD dev 2>/dev/null || git merge-base HEAD main)...HEAD
```

---

## Lockfile protocol

The gate rule (`.cursor/rules/code-review-gate.mdc`) uses `.cursor/review-lock.json` (gitignored) to avoid duplicate scans.

**Always:**

1. `uv run scripts/review-lock.py check <tier>` — if exit 0, reply one line and stop (unless user asked for a forced re-review).
2. Run Phases 1–8 below on the tier scope.
3. `uv run scripts/review-lock.py record <tier> --verdict passed|failed` — use the review verdict (failed if findings > 0 or lint/build fail).
4. After commit with no post-review edits: `record commit --verdict passed --inherit-from change`.

**Forced re-review:** user says "re-review" → skip check, run full review, overwrite lockfile record.

---

## Full Review Workflow (single pass — no subagents)

When running a **full review** (gate-triggered or explicit request), run **all phases in one session**. Do **not** launch Bugbot or Security subagents — Phases 7–8 inline those passes.

| Step | Pass | What to do |
|---|---|---|
| 1 | **Convention** | Phases 1–6 |
| 2 | **Logic** | Phase 7 — bug/regression pass (patterns from Bugbot-style review) |
| 3 | **Threat model** | Phase 8 — security pass beyond Phase 5 (patterns from Security Review) |
| 4 | **Validate** | `npm run lint` + `npm run build` |
| 5 | **Report** | One unified findings table |

Do not fix findings unless the user explicitly asked for fixes.

If there is **no diff at all**, report one sentence and stop.

---

## Phase 1 — TypeScript & Code Quality

> Delegates deep patterns to the `code-quality` skill. Load it if any issue is found here.

Check every modified file for:

| Rule | What to look for |
|---|---|
| No `any` | `useRef<any>`, `as any`, `shapes: any[]`, untyped props |
| No `@ts-nocheck` | Header comments on any `.ts`/`.tsx` file |
| No bare `catch (e) {}` | Use `catch {}` (no binding) for suppression, or log-and-rethrow |
| Async/await only | `.then()/.catch()` chains anywhere; `useEffect` wrapping async work |
| No `console.log/debug/info` | Only `console.error/warn` allowed for system failures |
| Unused variables | Must be prefixed with `_` or removed |
| Missing hook deps | All referenced vars must appear in `useEffect`/`useCallback` dep arrays |
| Block separation | Config → state → derived → effects → handlers → return, blank line before `return` |

**Gate:** Run `npm run lint` — must produce **0 errors**. If it fails, stop and fix before continuing.

---

## Phase 2 — Architecture & Reuse

> Delegates extraction decisions to the `ui-architecture` skill. Load it if any issue is found here.

| Rule | What to look for |
|---|---|
| No duplication | Same logic/layout in 2+ places → must be extracted to `src/lib/` or shared component |
| Hook placement | Reusable hooks must live in `src/hooks/<responsibility>/` — never inside component folders |
| Component structure | Feature roots use thin selectors; shared logic in `common/`, variants in `desktop/`/`mobile/` |
| No `any` wrapping | Don't mask type errors with casting to hide architecture gaps |
| CSS class reuse | Repeated Tailwind utility chains → extract to `src/styles/components/` |
| Minimal wrappers | JSX must use fewest wrappers needed for layout, semantics, or state — no gratuitous `<div>` nesting |

---

## Phase 3 — Performance & Memory

> Delegates cleanup patterns to the `performance` skill. Load it if any issue is found here.

| Rule | What to look for |
|---|---|
| `useEffect` cleanup | Every effect that creates a resource must return a cleanup function |
| Three.js disposal | Every `.geometry` and `.material` created in component scope must call `.dispose()` in cleanup |
| AudioContext | Must call `audioCtx.close()` in cleanup; `void promise.catch(() => {})` for intentional suppression |
| No render-loop allocations | No `new THREE.Vector3()`, array spreads, or object literals inside `useFrame` |
| Event listener cleanup | `addEventListener` → always paired with `removeEventListener` in cleanup |
| Ref mutations over state | Per-frame values must use `ref.current` mutation, not `setState` |

---

## Phase 4 — UI Interactions

> Delegates interaction wiring to the `ui-interactions` skill. Load it if any issue is found here.

Every interactive element **must** have all of these. Missing any one is a defect:

| Element type | Required |
|---|---|
| Button / link / menu item | `whileHover={{ scale: 1.05 }}` + `whileTap={{ scale: 0.95 }}` via `motion.*` |
| Button / link / menu item | `onMouseEnter={playHoverSound}` |
| Button / link / menu item | `onClick={playClickSound}` (in addition to primary handler) |
| Icon-only button | Must have `aria-label` |
| `<div onClick>` | Must be replaced with `<button type="button">` |

Sound imports come from `src/lib/sound/interactionSounds.ts`. A button without hover animation or sound is **always a defect** in this project.

---

## Phase 5 — Security

> Delegates security patterns to the `security` skill. Load it if any issue is found here.

| Rule | What to look for |
|---|---|
| No SQL interpolation | Supabase queries must use PostgREST parameterization — never string-interpolated user input |
| Supabase error checks | Every `.from()`, `.rpc()`, or `.storage` call must check the `error` field |
| No sensitive data in client | API keys, tokens, passwords must never appear in component code or be logged |
| Error messages | `catch` blocks must log `e instanceof Error ? e.message : String(e)` — never raw `e` |

---

## Phase 6 — Domain-Specific Patterns

Check these only when the files in scope use these technologies:

### Three.js / React Three Fiber

Load the `threejs` skill if issues are found.

- No object instantiation inside `useFrame` (geometry, materials, vectors)
- `InstancedMesh` used for many identical geometries
- `ShaderMaterial` typed as `THREE.ShaderMaterial`, not `THREE.Material` or `any`
- All uniforms typed with concrete types, not `any`

### Supabase

Load the `supabase` skill if issues are found.

- RLS policies assumed to be in place — never skip error checking because "it's protected"
- All async Supabase calls wrapped in `try/catch` or checking `{ data, error }` destructuring
- No hardcoded table names duplicated across files — use shared query helpers in `src/lib/`

### AnimationOrchestrator / AnimationContext

- Complex multi-step sequences must use `AnimationOrchestrator` from `src/lib/`, not ad-hoc `setTimeout` chains
- `AnimationContext` must be used for shared animation state, not prop-drilling booleans

---

## Phase 7 — Logic & Regression (Bugbot-style)

Inline pass inspired by Bugbot — hunt **real bugs and regressions** in the diff, not style nits already covered in Phases 1–6.

Check every changed file for:

| Category | What to look for |
|---|---|
| **API / doc drift** | Skills, rules, or README document APIs, props, or env vars that do not exist in code (e.g. wrong `AnimationOrchestrator` surface) |
| **Workflow contradictions** | Agent instructions that conflict with each other or with repo rules (e.g. mandatory `git push` vs push-consent rule) |
| **Logic errors** | Off-by-one, wrong branch conditions, stale closures, race conditions, missing null checks on new paths |
| **Incomplete migrations** | GitHub Copilot copy left behind when Cursor canonical skill was updated — behavior diverges by tool |
| **Hook / script bugs** | Wrong diff scope, infinite follow-up loops, state not reset on new changes |
| **Edge cases** | New code paths without error handling; cleanup skipped on failure; effects that fire after unmount |

Load `.cursor/skills/quality/code-quality/SKILL.md` only if Phase 1 already surfaced issues needing deeper patterns.

---

## Phase 8 — Threat Model (Security Review-style)

Inline pass inspired by Security Review — go beyond Phase 5 convention checks. For each finding, mentally trace: **attack path → impact → evidence in diff**.

| Category | What to look for |
|---|---|
| **`VITE_*` exposure** | Server-only secrets (R2 keys, service role, PATs) must never use `VITE_` prefix — Vite inlines them into `dist/`. R2 belongs in Supabase edge secrets only (`r2-presign`). |
| **Credential storage** | Tokens in committed config (`.cursor/mcp.json`, `.env.example`, hooks); files that should be gitignored |
| **Injection** | Shell hooks/scripts: use argument lists, never `shell=True` with user input; no string-built git/shell commands from hook JSON |
| **Auth / tenancy** | New admin paths skipping session checks; Supabase calls without `{ data, error }` checks; RLS assumed but bypassed |
| **Client trust boundaries** | Sensitive ops moved to client that should stay server-side; presign bypass |
| **Supply chain** | New prod `dependencies` with no `src/` usage; unnecessary runtime packages |
| **Agent policy** | Instructions that weaken security (relax prod CORS, skip push consent, commit secrets) |

Load `.cursor/skills/quality/security/SKILL.md` only if Phase 5 or this phase surfaces issues needing deeper patterns.

**Severity guide:** `Critical` = active secret in committed code or exploitable without user action. `High` = realistic misconfig footgun or missing auth on sensitive path. `Medium` = doc/policy inconsistency with plausible exploit path. `Low` = hygiene only.

---

## Validation Gate

After all phases are checked, always run both commands and confirm zero errors:

```bash
npm run lint   # 0 errors required
npm run build  # tsc -b + vite build must succeed
```

If either fails, fix the error before reporting the review as complete.

---

## Output Format

### Unified findings table (full review)

After all phases, merge **every** finding into **one** markdown table — primary deliverable:

| Severity | Source | Location (file:line) | Finding |
|---|---|---|---|
| High | Security | `.env.example:4` | R2 secrets documented under `VITE_*` prefix |
| Medium | Logic | `threejs/SKILL.md:192` | Documents nonexistent `orchestrator.phase` API |
| Medium | Convention (Phase 4) | `RocketReplayButton.tsx:104` | Missing `playClickSound()` on click handler |

**Columns:**

- **Severity** — `Critical`, `High`, `Medium`, `Low` (sort rows highest first)
- **Source** — `Convention (Phase N)`, `Logic`, or `Security`
- **Location** — `path/to/file.ext:line` (line optional when unknown)
- **Finding** — one concise sentence

**Deduplication:** If Logic and Security flag the same issue, keep one row with Source `Logic, Security`.

### Phase detail (convention pass only)

When reporting convention-phase detail (optional appendix), use:

```
[Phase N] File: path/to/file.tsx line N
  Issue: <what is wrong>
  Fix: <concrete change required>
```

If no issues in a phase, write: `Phase N — ✓ clean`.

### Verdict

After the unified table, provide:

- **Lint/build:** pass or fail (with error count if fail)
- **Counts:** `Convention: N | Logic: N | Security: N | Total: N`
- One-line verdict:
  - **"Review passed"** — zero findings, lint and build pass.
  - **"Review failed"** — total finding count > 0 and/or lint/build failed.

---

## Notes

- **No subagents** — Phases 7–8 inline Bugbot/Security Review goals without extra model calls.
- **Gate rule** — `.cursor/rules/code-review-gate.mdc` triggers this skill at commit / PR / push milestones with lockfile dedup.
- Convention phases **delegate** to existing skills — load only when a phase surfaces issues.
- `.cursor/skills/review/pr-review/SKILL.md` handles GitHub thread workflow; this skill handles **code inspection** first.
- Known lint warnings in `IrisTransition.tsx` and `SectionEntranceOverlay.tsx` (fast-refresh) are acceptable — not errors.
