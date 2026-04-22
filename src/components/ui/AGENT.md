<!--
  ~ Copyright (c) 2026 Guy Erreich
  ~
  ~ SPDX-License-Identifier: MIT
-->

# UI Folder Agent Notes

Use this folder for shared UI primitives and feature-level UI composition.

## Rules

- Search this folder before creating a new UI component elsewhere.
- If a visual shell, control, or interaction pattern repeats, extract it into a shared component here or into a feature `common/` folder.
- Keep feature root components thin when they mainly select between desktop/mobile variants.
- Preserve accessibility and interaction feedback when refactoring.
- If repeated layout utilities appear, move them into `src/styles/components/` rather than duplicating class chains.

## Structure

- Cross-feature primitives stay directly under `src/components/ui/`.
- Feature-specific reusable blocks should live under `src/components/ui/<feature>/common/`.
- Feature-specific layout variants should live under `src/components/ui/<feature>/desktop/` and `src/components/ui/<feature>/mobile/`.

## Skill Usage

- Use `ui-architecture` when refactoring UI structure or deciding whether code belongs in shared UI primitives versus feature folders.
- Use `ui-interactions` when changing buttons, links, hover states, click behavior, or motion/audio feedback.
- Use `code-quality` when reducing duplication, fixing lint issues, or tightening types while refactoring.
