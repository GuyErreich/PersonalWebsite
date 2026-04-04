---
name: "ui-interactions"
description: "Use when: adding, editing, or refactoring UI components that need to respond to user interactions (hover, click, menus) with animations and sounds."
---

# UI Interactions & Feedback Skill

Everything should feel interactive and tactile in this project. Apply this skill whenever you are making UI components, buttons, menus, or interactive cards.

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

### 3. Implementation Example
```tsx
import { motion } from 'framer-motion';
import { playHoverSound, playClickSound } from '../lib/sound/interactionSounds';

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