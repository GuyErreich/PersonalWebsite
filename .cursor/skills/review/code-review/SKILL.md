---
name: code-review
description: Systematically reviews code across six phases (quality, architecture, performance, interactions, security, domain). Use before committing, for PR self-review, or when auditing files for project convention compliance.
disable-model-invocation: true
---

# Code Review Skill

Systematically reviews code in this React + TypeScript + Vite project across **six phases**. Each phase maps to an existing skill — load it only if issues are found in that phase.

This skill is designed to catch what Copilot's general reviewer misses: project-specific conventions, reuse violations, interaction gaps, and domain-specific resource handling.

---

## Scope Determination

Before reviewing, determine what to review:

1. If an argument was provided → review that file/area only.
2. If invoked from a PR context → review all files changed versus the default branch (`git diff dev...HEAD --name-only`).
3. If invoked generally → ask the user which file or area to focus on before starting.

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

## Validation Gate

After all phases are checked, always run both commands and confirm zero errors:

```bash
npm run lint   # 0 errors required
npm run build  # tsc -b + vite build must succeed
```

If either fails, fix the error before reporting the review as complete.

---

## Output Format

Report findings grouped by phase. For each issue:

```
[Phase] File: path/to/file.tsx line N
  Issue: <what is wrong>
  Fix: <concrete change required>
```

If no issues are found in a phase, write: `Phase N — ✓ clean`.

After all phases, provide a one-line verdict:
- **"Review passed"** — zero defects found, lint and build pass.
- **"Review failed"** — list count of defects per phase.

---

## Notes

- This skill intentionally **delegates** to existing skills (`code-quality`, `performance`, `security`, `threejs`, `ui-architecture`, `ui-interactions`) rather than duplicating their content. Load the relevant skill when its phase surfaces issues.
- `.cursor/skills/review/pr-review/SKILL.md` handles the GitHub thread workflow (fetching, replying, resolving). This skill handles the **code inspection** step that precedes that workflow.
- Known lint warnings in `IrisTransition.tsx` and `SectionEntranceOverlay.tsx` (fast-refresh) are acceptable — they are not errors.
