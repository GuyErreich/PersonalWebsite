---
description: "Use when: adding, editing, or refactoring UI components that need to respond to user interactions (hover, click, menus) with animations and sounds."
applyTo: "src/components/**/*.tsx"
---

# UI Interactions & Feedback Instructions

Apply these rules when making UI components, buttons, menus, or interactive cards:

## 1. Reuse
- Before creating a new interactive component, search for existing shared primitives or classes to reuse or extend.
- Extract shared interaction logic into a component or hook if repeated in 2+ places.

## 2. Motion & Sound
- Use Framer Motion elements for interactive tags (`<motion.button>`, `<motion.a>`).
- Implement smooth spring animations for hover/tap.
- Use generative sound feedback from `src/lib/sound/interactionSounds.ts` (never external assets).
- Cover all dismiss paths for menus/modals with `playMenuCloseSound`.

## 3. Accessibility
- Never attach `onClick` to non-interactive elements. Use semantic elements (`button`, `a`, etc.).
- Always add `aria-label` to icon-only buttons.

Follow these rules for interactive, accessible UI.