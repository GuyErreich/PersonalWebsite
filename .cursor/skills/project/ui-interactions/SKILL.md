---
name: ui-interactions
description: Project tactile-UI contract — Framer Motion micro-interactions and generative sound feedback on interactive elements. Use when adding or editing buttons, menus, modals, or interactive cards in this project. Extends engineering and web/ui.
disable-model-invocation: true
---

# UI Interactions & Feedback (project)

Everything interactive in this project should feel tactile: motion on hover/tap plus generative sound feedback. This is a project-specific overlay on top of the generic UI rules — it encodes contracts unique to this codebase.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` and `.cursor/skills/code/web/ui/SKILL.md` first (reuse, accessibility, semantic elements). This skill adds the project's motion and sound contract.

## Motion

- Use Framer Motion equivalents (`<motion.button>`, `<motion.a>`) for interactive elements.
- Spring feedback on hover and tap:
  - `whileHover={{ scale: 1.05 }}` (adjust scale to fit layout)
  - `whileTap={{ scale: 0.95 }}`

## Generative sound feedback

- Do not use external audio assets (`.mp3`, etc.) — they bloat load size. Use the project's `window.AudioContext` utility.
- Sound helpers live in `src/lib/sound/interactionSounds.ts`: `playHoverSound`, `playClickSound`, `playMenuOpenSound`, `playMenuCloseSound`.
- Wire `playHoverSound` on `onMouseEnter` and `playClickSound` on `onClick` (in addition to the primary handler).
- **Cover every dismiss path** — each way a user can close a menu/modal must fire `playMenuCloseSound`: close button, backdrop/overlay click, navigation links that close the menu, and any programmatic close triggered by user action.

A button without hover animation or sound is a defect in this project.

## Accessibility

Follow `code/web/ui` accessibility rules: interactive behavior on semantic elements only, `aria-label` on icon-only buttons. See `references/sound-feedback.md` for the implementation example.

## When to load references

Load `references/sound-feedback.md` for the full implementation example and dismiss-path checklist.
