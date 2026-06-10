---
name: animation-review
description: Reviews GSAP, Framer Motion, and Three.js code for performance, memory leaks, and render efficiency. Use when reviewing or optimizing animation, WebGL, or orchestration code.
disable-model-invocation: true
---

# Animation & 3D Performance Review

Specialized review for WebGL and DOM animation logic. Ignore unrelated CSS or accessibility unless it impacts the render thread.

## Focus Areas

### 1. Memory Management

- `useEffect` cleanup for event listeners and manual GSAP tweens
- Dispose `THREE.Geometry`, `THREE.Material`, and textures when manually instantiated
- GSAP `useGSAP` hook used with correct dependency tracking
- AudioContext closed on unmount

### 2. Render Loop Stutters

- Flag object instantiation (`new Vector3()`, etc.) inside `useFrame` or `onUpdate` callbacks

### 3. React Render Thrashing

- Animations updating React state every frame → recommend ref mutation instead

### 4. Orchestration

- Complex timelines should use `AnimationOrchestrator` from `src/lib/` — not ad-hoc `setTimeout` chains

### 5. TypeScript in Animation Files

- No `@ts-nocheck`, no `(window as any)`
- Cast `material` to concrete type before uniform access
- No bare `catch (e) {}` — use `catch {}` for intentional suppression
- Complete hook dependency arrays

Load `.cursor/skills/frontend/threejs/SKILL.md` and `.cursor/skills/quality/performance/SKILL.md` for detailed patterns and fixes.
