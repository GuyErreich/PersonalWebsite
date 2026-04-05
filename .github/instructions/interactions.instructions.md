---
description: "Use when: adding or editing UI components that should be interactive"
applyTo: "src/components/**/*.tsx"
---

# UI Interactions & Feedback Guidelines

Everything should feel interactive and tactile in this project. Every hover and click should be felt by the user.

1. **Micro-interactions:**
   - Always replace plain `<button>` / `<a>` with Framer Motion equivalents (`<motion.button>`, `<motion.a>`).
   - Use `framer-motion` for smooth spring animations (e.g. `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`).

2. **Sound Feedback:**
   - Interactive elements (buttons, links, menus) MUST use our centralized generative audio system. No external audio files to avoid load times.
   - Import our predefined sounds from `src/lib/sound/interactionSounds.ts`:
     - `playHoverSound` on `onMouseEnter`
     - `playClickSound` on `onClick`
     - Utilize `playMenuOpenSound` / `playMenuCloseSound` for drawers, modals, toggles.
   - Example implementation:
     ```tsx
     import { motion } from 'framer-motion';
     import { playHoverSound, playClickSound } from '../lib/sound/interactionSounds';

     <motion.button
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
       onMouseEnter={playHoverSound}
       onClick={playClickSound}
       className="..."
     >
       Click me
     </motion.button>
     ```

3. **Accessibility — Semantic Elements:**
   - Never put `onClick` on `<div>`, `<span>`, or `<motion.div>`/`<motion.span>`. They are invisible to keyboard and screen reader users.
   - Use `<motion.button type="button">` for actions, `<motion.a>` / `<Link>` for navigation.
   - All icon-only buttons (close, X, hamburger) MUST have an `aria-label`.

4. **Sound Completeness — All Dismiss Paths:**
   - Every way a user can close a menu, modal, or drawer must fire `playMenuCloseSound`:
     - Close button onClick
     - Backdrop/overlay onClick
     - Nav link onClick (when it also closes the menu)
   - Missing a dismiss path is a bug, not an omission.

5. **Consistency:**
   - If a mild response is technically feasible, add it. Even a faint `sine` wave tick adds massive tactile quality.

6. **Reuse Before Creating:**
   - Before adding a new component or hook, search `src/components/` and `src/lib/` for an existing one.
   - Before adding `style={{}}` with a gradient or pattern, check `src/index.css` `@layer components` for an existing class.
   - Prefer `className` with a CSS class over `style={{}}` for anything that could appear more than once.

7. **File Size:**
   - Keep component files under ~150 lines. Extract sub-components into their own files when exceeded.
