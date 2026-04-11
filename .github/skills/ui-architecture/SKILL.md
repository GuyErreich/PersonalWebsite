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
