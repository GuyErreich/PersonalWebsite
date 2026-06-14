---
name: "threejs"
description: "Use when: creating, editing, or reviewing Three.js, React Three Fiber (R3F), or 3D background components. Triggers on useFrame, THREE, R3F, ShaderMaterial, particle systems, orbit tracks, implosion, galaxy, hyperspace, canvas, WebGL."
---

# React Three Fiber & 3D Skill

Apply every rule below when writing or reviewing any file under `src/components/backgrounds/three/`.

---

## 1. Performance — Render Loop Rules

**Never allocate inside `useFrame`.** Allocating `new THREE.Vector3()`, `new THREE.Color()`, or any object on every frame causes GC stutters within seconds.

```ts
// BAD — allocates a new Vector3 60 times per second
useFrame(() => {
  mesh.current.position.add(new THREE.Vector3(0, 0.01, 0));
});

// GOOD — reuse a ref value declared once
const vel = useMemo(() => new THREE.Vector3(0, 0.01, 0), []);
useFrame(() => {
  mesh.current.position.add(vel);
});
```

**Prefer `InstancedMesh` for many identical geometries** (stars, dust, particles):

```ts
// Use THREE.InstancedMesh instead of mapping hundreds of <mesh> elements
const mesh = useRef<THREE.InstancedMesh>(null);
// Update per-instance transforms with dummy.matrix + mesh.setMatrixAt(i, dummy.matrix)
```

**Prefer direct ref mutation over React state for per-frame values:**

```ts
// BAD — triggers re-render every frame
const [opacity, setOpacity] = useState(0);
useFrame(() => setOpacity(t));

// GOOD — direct ShaderMaterial uniform mutation, zero re-renders
const mat = meshRef.current.material as THREE.ShaderMaterial;
mat.uniforms.uOpacity.value = t;
```

---

## 2. TypeScript — No `any`, No `@ts-nocheck`

### Typed refs

```ts
const meshRef = useRef<THREE.Mesh>(null);
const groupRef = useRef<THREE.Group>(null);
const pointsRef = useRef<THREE.Points>(null);
const lineRef = useRef<THREE.LineSegments>(null);
```

### Material uniforms — always cast to the concrete class

```ts
// BAD
meshRef.current.material.uniforms.uOpacity.value = 1; // TS error: property 'uniforms' does not exist

// GOOD
const mat = meshRef.current.material as THREE.ShaderMaterial;
mat.uniforms.uOpacity.value = 1;
```

### Typed `useFrame` shared utility functions

```ts
// BAD — implicit `any` parameter
export const getImplosionState = (t) => { ... }

// GOOD
export const getImplosionState = (t: number) => { ... }
```

### Typed `forwardRef` props — no `any[]`

```ts
// BAD
forwardRef<THREE.Group, { shapes: any[]; visible: boolean }>(...)

// GOOD — define a named interface
interface OrbitShape {
  x: number;
  z: number;
  angle?: number;
}
forwardRef<THREE.Group, { shapes: OrbitShape[]; visible: boolean }>(...)
```

### BufferGeometry attribute access — cast `array` after reading from R3F's `attributes`

```ts
const posArr = mesh.geometry.attributes.position.array as Float32Array;
const alphaArr = mesh.geometry.attributes.aAlpha.array as Float32Array;
```

---

## 3. Ecosystem — Use `@react-three/drei`

Prefer `drei` helpers over raw Three.js primitives:

| Task             | Use                                                          |
| ---------------- | ------------------------------------------------------------ |
| Floating/bobbing | `<Float speed={3} rotationIntensity={1} floatIntensity={2}>` |
| Loading GLTF     | `useGLTF`                                                    |
| Particle clouds  | `<Sparkles>`                                                 |
| Stats/debug      | `<Stats>`                                                    |
| Camera controls  | `<OrbitControls>`                                            |

Never use `requestAnimationFrame` directly — always use `useFrame` from `@react-three/fiber`.

---

## 4. Shaders — Uniform Pattern

Define uniforms with `useMemo` so the object reference is stable across renders:

```ts
const uniforms = useMemo(
  () => ({
    uOpacity: { value: 0.0 },
    uIntensity: { value: 1.0 },
    uSize: { value: 3.0 },
  }),
  [],
);
```

Mutate inside `useFrame`:

```ts
useFrame(({ clock }) => {
  const mat = meshRef.current.material as THREE.ShaderMaterial;
  mat.uniforms.uOpacity.value = Math.min(1, clock.elapsedTime / 2);
});
```

Attach to a `<shaderMaterial>` in JSX:

```tsx
<shaderMaterial
  uniforms={uniforms}
  vertexShader={vertexShader}
  fragmentShader={fragmentShader}
  transparent
  blending={THREE.AdditiveBlending}
  depthWrite={false}
/>
```

---

## 5. AudioContext in 3D Components

Audio components that live inside the canvas context (e.g. `FloatingThoughtsAudio`, `ShockwaveAudio`) synthesize sound via `AudioContext`. Always:

- Use the vendor-safe cast — never `(window as any)`:
  ```ts
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  ```
- Suppress unsupported-browser errors with `catch { }` (no binding), never `catch (e) {}`.
- Close the context in the `useEffect` cleanup:
  ```ts
  return () => {
    if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
  };
  ```

---

## 6. AnimationOrchestrator Integration

When a 3D component needs to sync with UI stages (text reveals, section transitions):

```ts
import { useOrchestrator } from "../../../../lib/AnimationContext";

const orchestrator = useOrchestrator();
useFrame(() => {
  if (orchestrator.phase === "galaxy") {
    // activate galaxy visuals
  }
});
```

Never drive this synchronization through React state updates from inside `useFrame` — use the orchestrator's phase directly.

---

## 7. Cleanup Checklist

Before finishing any R3F component, verify:

- [ ] No `new THREE.*` inside `useFrame`
- [ ] No `@ts-nocheck`, no `any` (especially `material` access and `forwardRef` props)
- [ ] All uniforms defined via `useMemo` and mutated (not replaced) in `useFrame`
- [ ] Audio effects use `catch { }` and close the context on unmount
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → must succeed
