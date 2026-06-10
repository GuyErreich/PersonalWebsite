---
name: create-r3f-component
description: Scaffolds a new React Three Fiber component with standard imports, typing, and performance optimizations under src/components/backgrounds/three/. Use when creating or scaffolding R3F/Three.js background components.
disable-model-invocation: true
---

# Create R3F Component

Load `.cursor/skills/frontend/threejs/SKILL.md` and `.cursor/skills/quality/code-quality/SKILL.md` before generating.

## Requirements

1. Functional TypeScript component — no `any`, no `@ts-nocheck`
2. Place under `src/components/backgrounds/three/`
3. Import from `@react-three/fiber` and `@react-three/drei`
4. If animated: use `useFrame`; declare vectors/colors via `useMemo`/`useRef` **outside** the loop
5. Cast `mesh.material` to `THREE.ShaderMaterial` (or concrete class) before uniform access
6. Named interfaces for all props — never `any[]`
7. Export for canvas use; extend `GroupProps` or `MeshProps` where applicable
8. Confirm code would pass `npm run lint` and `npm run build`

## Shader Template

```tsx
const uniforms = useMemo(
  () => ({ uOpacity: { value: 0.0 } }),
  [],
);

useFrame(({ clock }) => {
  const mat = meshRef.current?.material as THREE.ShaderMaterial;
  if (mat) mat.uniforms.uOpacity.value = Math.min(1, clock.elapsedTime / 2);
});
```

Ask the user for the component requirement if not provided.
