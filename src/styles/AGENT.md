<!--
  ~ Copyright (c) 2026 Guy Erreich
  ~
  ~ SPDX-License-Identifier: MIT
-->

# Styles Folder Agent Notes

Use this folder for shared CSS organized by responsibility.

## Rules

- Keep defaults and global primitives in base files.
- Put reusable feature or component classes in focused files under `src/styles/components/`.
- Before introducing a new long utility chain in JSX, check whether a named class already exists here.
- If the same utility chain appears in 2 or more places, extract it into a shared class.
- Before introducing numeric CSS literals, look for an existing token/variable/class to reuse; if the same value is needed in 2+ places, create a shared CSS variable/class in the same change.
- Solve sizing/positioning at the highest layout boundary first (section/root/frame), then let nested content conform; only add deeper overrides if the higher-level boundary cannot solve the case.
- Avoid moving one-off styles into shared CSS unless they are likely to repeat.

## Naming

- Use feature-oriented names for reusable classes, for example `gamedev-panel-card` or `hero-title`.
- Prefer semantic block names over styling-only names when the class represents a reusable layout role.

## Skill Usage

- Use `ui-architecture` when deciding whether repeated utility chains should become named reusable classes.
- Use `code-quality` when style refactors interact with validation, lint, or build constraints.
