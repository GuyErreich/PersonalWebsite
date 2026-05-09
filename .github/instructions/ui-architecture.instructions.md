---
description: "Use when: designing, refactoring, or reviewing UI structure for reuse, responsive variants, and maintainability."
applyTo: "src/components/**, src/hooks/**, src/styles/**"
---

# UI Architecture & Reuse Instructions

Apply these rules when building or refactoring UI architecture:

## 1. Reuse-First
- Before creating new components/hooks/styles, search for existing reusable options.
- If an existing primitive covers 80%+ of the need, extend it instead of duplicating.
- Prefer consistent naming and composition over custom patterns.

## 2. Extraction
- Extract shared logic immediately if repeated in 2+ places (JSX shell, state/effects, utility-class chains).
- Place shared components in `common/`, hooks in `src/hooks/<responsibility>/`, and styles in `src/styles/components/<feature>.css`.

## 3. Folder Structure
- Use `common/`, `desktop/`, and `mobile/` for feature-specific code.
- Keep selector components thin and declarative.
- Design base primitives at top-level, extend with section wrappers.
- Refactor duplicated logic to base + wrappers unless user requests a minimal patch.

Follow these rules for maintainable, reusable UI.