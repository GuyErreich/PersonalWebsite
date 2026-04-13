---
name: "ui-architecture"
description: "Use when: designing, refactoring, or reviewing UI structure for reuse, responsive variants, and maintainability."
---

# UI Architecture & Reuse Workflow

Use this skill when building or refactoring UI architecture, not just visual details.

## 1. Reuse-First Rule (Mandatory)

- Before creating any new component/hook/style class, search for existing reusable options.
- If an existing primitive covers 80%+ of the need, extend it instead of creating a near-duplicate.
- Prefer consistent naming and composition over one-off custom patterns.

## 2. Extraction Triggers

Extract shared logic immediately when any of these happens:

- The same JSX shell appears in 2+ places.
- The same effect/state orchestration appears in 2+ places.
- The same utility-class chain appears in 2+ places.
- A component exceeds readability due to mixed concerns (data + layout + interactions).

Extraction targets:

- Repeated JSX shell -> shared component in `common/`
- Repeated state/effects -> hook in `src/hooks/<responsibility>/`
- Repeated utility chains -> named classes in `src/styles/components/<feature>.css`

## 3. Folder Architecture for Features

For UI-heavy features, prefer:

- `common/` for shared shells, controls, types, and data constants.
- `desktop/` for desktop-specific layout composition.
- `mobile/` for mobile-specific layout composition.
- feature root selector component that chooses desktop/mobile variants via media-query hook.

Keep selector components thin and declarative.

### Abstraction & Extension Pattern (Required)

- Design reusable base primitives at top-level common boundaries, then extend per feature/section with thin wrappers.
- Use section `common/`, `desktop/`, and `mobile/` wrappers for section theme/behavior differences while preserving shared core logic.
- Reuse section wrappers across responsive variants; avoid duplicating implementation across desktop/mobile files.
- Keep naming consistent with the dominant naming style in each feature domain; avoid introducing alternate suffixes that fragment naming conventions.
- Apply this pattern broadly (pagination, cards, controls, overlays, filter bars, etc.), not just to one UI element type.
- Pagination remains the reference example: global dots + global desktop base, then section wrappers for theme-specific behavior.

### Default Enforcement (Blocking)

- When editing duplicated UI shell/motion/interaction logic, extraction is mandatory in the same change.
- Do not stop at visual parity if the same logic appears elsewhere; refactor to a base primitive + wrappers before finishing.
- Only skip same-change extraction if explicitly instructed by the user to do a minimal one-off patch.

### Start-First Checkpoint (Blocking)

- Before writing implementation code, define the intended base primitive, section wrapper(s), and responsive variant boundaries.
- If section differences are known upfront (theme, spacing, behavior), create section wrappers first and implement through wrappers rather than calling base primitives directly from feature screens.

## 4. Component Design Principles

- Keep top-level components focused on composition, not implementation details.
- Keep wrappers minimal: each container must provide layout, semantics, state boundary, or scroll boundary.
- Use modern layout primitives (Grid/Flex). Do not use table layout for page structure.
- Preserve accessibility and interaction fidelity while refactoring.

## 5. Data & View Separation

- Move data fetching/state orchestration into hooks when UI files become mixed-concern.
- UI components should consume typed props from hooks rather than query APIs directly.
- Keep hooks in responsibility folders (e.g., `hooks/gamedev/`, `hooks/responsive/`).

## 6. Validation Checklist

After architectural refactors:

- `npm run lint` must pass with zero errors.
- `npm run build` must pass.
- Verify no stale duplicate files remain after folder reorganizations.
- Verify imports are updated to new folder boundaries.
