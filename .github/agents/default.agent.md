---
name: "default-agent"
description: "Default agent with knowledge of the site's development standards, interaction guidelines, and UI patterns."
skills:
  - ui-interactions
  - code-quality
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

4. **TypeScript Strictness (zero tolerance):**
   - Never use `any`. Use specific types or named interfaces. For browser vendor APIs: `(window as Window & { webkitAudioContext?: typeof AudioContext })`.
   - Never use `@ts-nocheck`. Fix the underlying type — add parameter types, cast `material` to `THREE.ShaderMaterial`, etc.
   - Never write `catch (e) {}`. Use `catch { }` (no binding) for intentional suppression.
   - Prefix unused variables with `_` instead of adding `eslint-disable` comments.
   - Always include all referenced variables in `useEffect`/`useCallback` dependency arrays.
   - Validate with `npm run lint` (0 errors) and `npm run build` (must succeed) before finishing.

5. **Console Logging (production-ready):**
   - `console.log`, `console.debug`, `console.info` are **lint errors** — never use them.
   - `console.error` and `console.warn` are allowed only for unrecoverable browser API failures (GLSL shader errors, AudioContext not supported) and expected degradations.
   - When logging a caught error, always log `e instanceof Error ? e.message : String(e)` — never the raw error object, which may embed user input or stack internals.
   - See §11 in the `code-quality` skill for the full pattern and audit baseline.

Follow the `ui-interactions` skill for specific code implementation examples when building new UI elements.
Follow the `code-quality` skill for TypeScript/ESLint patterns, the DRY rule, and the validation checklist.
