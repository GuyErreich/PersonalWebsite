<!--
  ~ Copyright (c) 2026 Guy Erreich
  ~
  ~ SPDX-License-Identifier: MIT
-->

# DevOps UI Agent Notes

Use this folder for DevOps-specific UI composition.

## Rules

- Check `common/` before creating any new background, project-grid wrapper, shared type, or data constant.
- Put shared building blocks in `common/`.
- Put desktop-only layout composition in `desktop/`.
- Put mobile-only layout composition in `mobile/`.
- Keep `DevOpsProjectsPanel.tsx` as a thin selector component.
- If project-card orchestration or DevOps-specific view logic starts repeating, extract it into a shared hook under `src/hooks/<responsibility>/`.
- If repeated layout classes appear, move them into shared CSS classes instead of duplicating utility chains.
- Keep wrappers minimal and container-driven.

## Skill Usage

- Use `ui-architecture` for common/desktop/mobile boundaries and extraction decisions.
- Use `ui-interactions` when changing interactive project-card behavior or action controls.
- Use `code-quality` for duplication cleanup, typing, and validation during structural refactors.
