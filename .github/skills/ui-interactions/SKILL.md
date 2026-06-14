---
name: "ui-interactions"
description: "Use when: adding, editing, or refactoring UI components that need to respond to user interactions (hover, click, menus) with animations and sounds."
---

# UI Interactions & Feedback Skill

Everything should feel interactive and tactile in this project. Apply this skill whenever you are making UI components, buttons, menus, or interactive cards.

### 0. Reuse Before Creating

- Before creating a new interactive component, search for an existing shared button, panel shell, layout wrapper, hook, or CSS class that can be reused or extended.
- Before adding new inline utility chains, check `src/styles/` for an existing named class and extend that file if the pattern is likely to repeat.
- If the same interaction logic appears in two or more places, extract it immediately into a shared component or hook instead of duplicating it.
- For feature folders with multiple responsive variants, keep shared pieces in `common/` and split layout-specific code into `desktop/` and `mobile/` files.

### 1. Motion & Micro-interactions

- Replace standard HTML interactive tags (`<button>`, `<a>`) with Framer Motion equivalents (`<motion.button>`, `<motion.a>`).
- Implement smooth spring animations for hovering and tapping:
  - `whileHover={{ scale: 1.05 }}` (Adjust scale as necessary given layout)
  - `whileTap={{ scale: 0.95 }}`

### 2. Generative Sound Feedback

- DO NOT use external assets (like `.mp3` files) for UI interaction sounds as it bloats the loading sizes.
- Rely on our `window.AudioContext` utility file.
- Location: `src/lib/sound/interactionSounds.ts`.
- Exports: `playHoverSound`, `playClickSound`, `playMenuOpenSound`, `playMenuCloseSound`.
- **Cover ALL dismiss paths** — every way a user can close a menu/modal must fire `playMenuCloseSound`:
  - The close button
  - Backdrop/overlay clicks
  - Navigation link clicks that close the menu
  - Any programmatic close triggered by user action

### 3. Accessibility — Interactive Elements

**Never attach `onClick` to non-interactive elements.** Screen readers and keyboard users cannot reach `<div>`, `<span>`, or `<motion.div>` with an `onClick`. Use the correct semantic element:

```tsx
// BAD — span with onClick is not keyboard-focusable
<motion.span onClick={handleClick}>Open section</motion.span>

// GOOD — button is focusable, activatable via Enter/Space
<motion.button type="button" onClick={handleClick}>Open section</motion.button>
```

| Pattern                    | Correct element                                         |
| -------------------------- | ------------------------------------------------------- |
| Triggers navigation        | `<motion.a href="...">` or `<Link>`                     |
| Triggers an action         | `<motion.button type="button">`                         |
| Closes an overlay          | `<motion.button type="button" aria-label="Close menu">` |
| Backdrop / overlay dismiss | `<button type="button" aria-label="Close menu">`        |

Always add `aria-label` to icon-only buttons that have no visible text.

### 4. Implementation Example

```tsx
import { motion } from "framer-motion";
import { playHoverSound, playClickSound } from "../lib/sound/interactionSounds";

export const InteractiveButton = () => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={playHoverSound}
      onClick={playClickSound}
      className="p-2 bg-blue-500 rounded text-white"
    >
      Click Me
    </motion.button>
  );
};
```

### 5. Extraction Triggers

- Extract a shared component when two or more files repeat the same JSX structure with different labels or icons.
- Extract a shared hook when two or more files repeat the same state or effect orchestration.
- Extract a shared CSS class when two or more files repeat the same long utility-class chain.
- Keep selector components thin: choose desktop/mobile/common composition in one place, but keep the actual layout implementations in dedicated files.
