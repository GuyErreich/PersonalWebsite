---
name: create-r3f-component
description: "Scaffold a new React Three Fiber component with standard imports and performance optimizations"
---

Create a new React Three Fiber (R3F) component based on this requirement: {{@prompt}}

Load the `threejs` and `code-quality` skills before generating, then follow these rules:

1. Provide a completely functional React component using TypeScript — no `any`, no `@ts-nocheck`.
2. Place it logically under `src/components/backgrounds/three/`.
3. Import relevant helpers from `@react-three/fiber` and `@react-three/drei`.
4. If the prompt implies movement or animation: implement a `useFrame` loop, making sure to declare vectors, colors, or quaternions OUTSIDE the loop (or via `useMemo`) to prevent garbage collection stutters.
5. Cast `mesh.material` to `THREE.ShaderMaterial` (or the appropriate concrete class) before accessing uniforms.
6. Define named interfaces for all component props — never use `any[]`.
7. Export the component for use in the main canvas. Ensure props extend `GroupProps` or `MeshProps` where applicable.
8. After generating, confirm the code would pass `npm run lint` and `npm run build`.