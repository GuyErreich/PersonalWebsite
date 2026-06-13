# Responsive Variant Structure

For UI-heavy features with shared behavior plus per-viewport differences, use the abstraction-then-extension pattern (see engineering `folder-structure.md`):

- `common/` — shared shells, controls, types, and data constants.
- `desktop/` — desktop-specific layout composition.
- `mobile/` — mobile-specific layout composition.
- A thin feature-root selector that chooses the variant via a media-query hook.

## Rules

- Keep selector components thin and declarative — they choose composition, nothing more.
- Reuse section wrappers across responsive variants; do not duplicate implementation between `desktop/` and `mobile/`.
- Define the base primitive first, section wrappers second, responsive variants last.
- When section differences are known up front (theme, spacing, behavior), create the wrappers first and route implementation through them rather than calling the base directly from feature screens.
- Keep naming aligned with the dominant domain naming in the feature; do not introduce alternate suffixes that fragment conventions.

This pattern applies broadly (cards, controls, overlays, filter bars, pagination), not to one element type.

## Project specifics

The concrete folder names and any required hooks are project conventions. Read the nearest `AGENT.md` for the repository's structure.
