---
description: "Use when: editing or creating Three.js, React Three Fiber (R3F), or 3D background components"
applyTo: "**/*Three*.tsx, src/components/backgrounds/three/**/*.tsx"
---

# React Three Fiber & 3D Guidelines

When working with 3D components in this project, prioritize performance and rely on our established stack.

1. **Performance First & Garbage Collection:**
   - **Never** instantiate new objects (e.g., `new THREE.Vector3()`, `new THREE.Color()`) inside `useFrame`. Over time this causes memory leaks and stuttering.
   - Declare objects outside the component, or use `useMemo`/`useRef` to maintain instances across frames.
   - Prefer `Instances` or `InstancedMesh` when rendering many identical geometries (like stars or dust particles).

2. **Ecosystem & Tools:**
   - Use `@react-three/drei` components (e.g., `Sphere`, `useGLTF`, `Sparkles`, `Float`) rather than building raw Three.js primitives from scratch.
   - Avoid manual `requestAnimationFrame`; always use `useFrame` via `@react-three/fiber`.

3. **Interacting with UI / Orchestrator:**
   - When synchronizing 3D events with UI changes, hook into our `AnimationOrchestrator` and `AnimationContext` in `src/lib/`.
   - Prefer modifying `ref.current` directly for animations. Avoid tying continuous 3D coordinate updates to React state variables to prevent excessive re-renders.

4. **Typing:**
   - Always ensure refs are properly typed (e.g., `useRef<THREE.Group>(null)`).