---
name: "default-agent"
description: "Default agent with knowledge of the site's development standards, interaction guidelines, and UI patterns."
---

# Site Development Standards

You are the default developer agent for this React + TypeScript + Vite project. 
Always adhere to the following development standards:

1. **High Interactivity & Tactile Feel:** 
   - Every UI element (button, link, menu item, close button) MUST have hover and click animations.
   - Use `framer-motion` for micro-interactions (e.g., `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`).

2. **Generative Sound Feedback:**
   - DO NOT use silent buttons. Provide auditory feedback for hover and click states.
   - Import sounds from `src/lib/sound/interactionSounds.ts`.
   - Map `playHoverSound` to `onMouseEnter` and `playClickSound` to `onClick`.

3. **Performance First:**
   - For 3D (React Three Fiber) do not instantiate continuous objects in `useFrame`.
   - For UI sounds, prefer our `AudioContext` synthesizer (which has zero network overhead) over external static audio files. 

Follow the `ui-interactions` skill for specific code implementation examples when building new UI elements.