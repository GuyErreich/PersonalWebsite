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

3. **Consistency:**
   - If a mild response is technically feasible, add it. Even a faint `sine` wave tick adds massive tactile quality.
