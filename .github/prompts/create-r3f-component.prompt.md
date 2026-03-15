---
name: create-r3f-component
description: "Scaffold a new React Three Fiber component with standard imports and performance optimizations"
---

Create a new React Three Fiber (R3F) component based on this requirement: {{@prompt}}

Follow the project guidelines for 3D components:
1. Provide a completely functional React component using TypeScript.
2. Place it logically under `src/components/backgrounds/three/`.
3. Import relevant helpers from `@react-three/fiber` and `@react-three/drei`.
4. If the prompt implies movement or animation: implement a `useFrame` loop, making sure to declare vectors, colors, or quaternions OUTSIDE the loop (or via `useMemo`) to prevent garbage collection stutters.
5. Export the component for use in the main canvas. Ensure props extend `GroupProps` or `MeshProps` where applicable.