---
name: "performance"
description: "Use when: optimizing components, reducing memory usage, preventing memory leaks, profiling performance, or ensuring zero-leak audio/WebGL/Three.js resource cleanup. Triggers on useEffect cleanup, canvas, AudioContext, event listeners, ref management, bundle size, render optimization."
---

# Performance & Memory Management Skill

This project runs complex 3D scenes, animations, and interactive components that demand zero memory leaks and optimal performance. Apply this skill whenever you create components with Three.js, AudioContext, event listeners, animations, or any resource that requires cleanup.

---

## 1. Memory Leak Prevention — Resource Cleanup

Every resource that allocates memory **must** be freed in a `useEffect` cleanup function. This includes Three.js geometries/materials, AudioContext, event listeners, timers, and animations.

### AudioContext — Always Close in Cleanup

AudioContext holds system audio resources. Failure to close leaks memory and blocks audio for other pages.

**VULNERABLE (Memory Leak):**

```tsx
function useAudio() {
  const [ctx, setCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setCtx(audioCtx);
    // BUG: ctx never closed — memory leak
  }, []);

  return ctx;
}
```

**SECURE:**

```tsx
function useAudio() {
  const [ctx, setCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setCtx(audioCtx);

    return () => {
      void audioCtx.close().catch(() => {}); // intentional
    };
  }, []);

  return ctx;
}
```

**Why:** `audioCtx.close()` returns a Promise. Use `void promise.catch(() => {})` to mark intentional suppression.

### Three.js Geometries & Materials — Dispose in Cleanup

Three.js geometries and materials hold GPU memory. Call `.dispose()` on every geometry and material you create.

**VULNERABLE:**

```tsx
function ThreeScene() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const geom = new THREE.IcosahedronGeometry(10, 4);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geom, mat);
    groupRef.current?.add(mesh);
    // BUG: geom and mat never disposed — GPU memory leak
  }, []);

  return <group ref={groupRef} />;
}
```

**SECURE:**

```tsx
function ThreeScene() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const geom = new THREE.IcosahedronGeometry(10, 4);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geom, mat);
    groupRef.current?.add(mesh);

    return () => {
      geom.dispose();
      mat.dispose();
      if (mesh.parent) mesh.parent.remove(mesh);
    };
  }, []);

  return <group ref={groupRef} />;
}
```

### Event Listeners — Always Remove

Event listeners stay in memory until explicitly removed. Use `addEventListener` + cleanup in the same `useEffect`.

**VULNERABLE:**

```tsx
function useWindowResize() {
  const handleResize = () => console.log(window.innerWidth);
  window.addEventListener('resize', handleResize);
  // BUG: listener never removed — stays in memory for lifetime of page
}
```

**SECURE:**

```tsx
function useWindowResize() {
  useEffect(() => {
    const handleResize = () => console.log(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}
```

### Timers & Intervals — Always Clear

Forget to clear a timer and it runs forever (or until page reload).

**VULNERABLE:**

```tsx
useEffect(() => {
  setInterval(() => {
    // BUG: interval never cleared — runs forever
    playSound();
  }, 1000);
}, []);
```

**SECURE:**

```tsx
useEffect(() => {
  const id = setInterval(() => {
    playSound();
  }, 1000);

  return () => clearInterval(id);
}, []);
```

### AbortController for Fetch/Async Tasks

Long-running fetch or async operations can hold memory after a component unmounts. Use `AbortController` to cancel them.

**VULNERABLE:**

```tsx
useEffect(() => {
  async function fetchData() {
    const response = await fetch('/api/data');
    setData(await response.json());
  }
  fetchData();
  // BUG: if component unmounts before fetch completes, memory persists
}, []);
```

**SECURE:**

```tsx
useEffect(() => {
  const abort = new AbortController();

  void (async () => {
    try {
      const response = await fetch('/api/data', { signal: abort.signal });
      setData(await response.json());
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error(e instanceof Error ? e.message : String(e));
      }
    }
  })();

  return () => abort.abort();
}, []);
```

---

## 2. React Render Optimization

### useCallback for Event Handlers

Without `useCallback`, a new function instance is created on every render. This breaks dependency arrays and causes unnecessary re-renders of memoized child components.

**SUBOPTIMAL:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // handleClick is redefined every render
  const handleClick = () => setCount(c => c + 1);

  return <Child onClick={handleClick} />; // Child re-renders every time Parent renders
}
```

**OPTIMIZED:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // memoized: same function instance across renders
  const handleClick = useCallback(() => setCount(c => c + 1), []);

  return <Child onClick={handleClick} />; // Child re-renders only when props change
}
```

### useMemo for Expensive Computations

Any derived value that requires computation should be memoized if it's used in dependencies or passed to child components.

**SUBOPTIMAL:**

```tsx
function Component({ items }) {
  const filtered = items.filter(x => x.active); // recomputed every render
  return <List items={filtered} />; // List re-renders even if filtered result is identical
}
```

**OPTIMIZED:**

```tsx
function Component({ items }) {
  const filtered = useMemo(
    () => items.filter(x => x.active),
    [items]
  );
  return <List items={filtered} />;
}
```

### Memoize Components to Prevent Cascading Re-renders

Use `React.memo` on child components that don't need to re-render when parent state changes.

**SUBOPTIMAL:**

```tsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ExpensiveChild /> {/* re-renders on every count change */}
    </div>
  );
}
```

**OPTIMIZED:**

```tsx
const ExpensiveChild = React.memo(() => {
  // complex render logic
  return <div>...</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ExpensiveChild /> {/* only re-renders if props change */}
    </div>
  );
}
```

---

## 3. Three.js & Canvas Performance

### Reuse Geometries and Materials

Creating new geometries/materials every frame is expensive. Create them once and reuse.

**VULNERABLE:**

```tsx
function ParticleSystem() {
  useFrame(({ gl }) => {
    for (let i = 0; i < 10000; i++) {
      // BUG: 10,000 new geometries every frame
      const geom = new THREE.SphereGeometry(1, 8, 8);
      const mat = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geom, mat);
      // ...
    }
  });
}
```

**OPTIMIZED:**

```tsx
function ParticleSystem() {
  const geom = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const instances = useMemo(() => [], []);

  useFrame(() => {
    // Reuse and update existing meshes
    instances.forEach((mesh, i) => {
      mesh.position.set(Math.random(), Math.random(), Math.random());
    });
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);
}
```

### Use InstancedMesh for Thousands of Objects

If you have thousands of identical objects (particles, stars, grid lines), use `THREE.InstancedMesh` instead of individual meshes.

**SUBOPTIMAL (1000 draw calls):**

```tsx
const positions = [];
for (let i = 0; i < 1000; i++) {
  positions.push([Math.random(), Math.random(), Math.random()]);
}

function Stars() {
  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
}
```

**OPTIMIZED (1 draw call):**

```tsx
function Stars() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!mesh.current) return;

    const color = new THREE.Color();
    for (let i = 0; i < 1000; i++) {
      const matrix = new THREE.Matrix4()
        .setPosition(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
      mesh.current.setMatrixAt(i, matrix);
      color.setHSL(Math.random(), 0.5, 0.5);
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 1000]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
```

### Avoid Texture Memory Bloat

Large textures consume GPU VRAM. Use optimized sizes and remove unused textures.

- Resize textures to power-of-two dimensions (256, 512, 1024, 2048)
- Use compressed texture formats (WebP, AVIF) when possible
- Dispose of textures when no longer needed

```tsx
const texture = useMemo(() => {
  const t = new THREE.TextureLoader().load('/image.webp');
  return t;
}, []);

useEffect(() => {
  return () => {
    texture.dispose();
  };
}, [texture]);
```

---

## 4. Bundle Size & Code Splitting

### Dynamic Imports for Heavy Libraries

If a library (like a games dev library) is only used on one route, lazy-load it.

**BLOATS MAIN BUNDLE:**

```tsx
import HeavyGameEngine from './GameEngine'; // imported at top level

function App() {
  return <HeavyGameEngine />;
}
```

**OPTIMIZED:**

```tsx
const HeavyGameEngine = lazy(() => import('./GameEngine'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyGameEngine />
    </Suspense>
  );
}
```

### Remove Unused Imports

ESLint catches unused imports, but also check runtime imports (e.g., `console.log` calls):

```tsx
// BAD: unused import bloats bundle
import { someHelper } from './utils';

export function Component() {
  return <div>Hello</div>; // someHelper never used
}

// GOOD: remove unused imports
export function Component() {
  return <div>Hello</div>;
}
```

---

## 5. Animation Performance

### Use GSAP with Force3D When Possible

Force3D ensures GPU acceleration for smooth animations.

```tsx
import gsap from 'gsap';

useEffect(() => {
  gsap.to(elementRef.current, {
    duration: 1,
    x: 100,
    force3D: true, // GPU acceleration
    ease: 'power2.inOut',
  });
}, []);
```

### Throttle Expensive Listeners

If you listen to scroll, resize, or mousemove, throttle the callback to avoid 100+ calls/second.

```tsx
function useThrottledResize(callback: () => void, delay = 100) {
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeout.current) return;
      callback();
      timeout.current = setTimeout(() => {
        timeout.current = null;
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [callback, delay]);
}
```

---

## 6. Validation & Testing

### Use Chrome DevTools Memory Profiler

1. Open Chrome DevTools → Memory tab
2. Record heap snapshots before and after user actions
3. Compare snapshots: memory should return to baseline after component unmount
4. Look for detached DOM nodes and unreleased listeners

### Use React DevTools Profiler

1. Open React DevTools → Profiler tab
2. Record a render session
3. Identify components with unnecessary re-renders
4. Add `React.memo`, `useCallback`, or `useMemo` as needed

### Before Commit

Run the full build and lighthouse audit:

```bash
npm run build
# Check bundle size:
ls -lh dist/assets/*.js dist/assets/*.css

# Run Lighthouse in DevTools or:
# npx lighthouse https://localhost:5173 --view
```

---

## 7. Common Memory Leak Patterns & Fixes

| Pattern                                    | Memory Leak Risk | Fix                                                              |
| ------------------------------------------ | ---------------- | ---------------------------------------------------------------- |
| `new AudioContext()` without close         | HIGH             | Call `ctx.close()` in cleanup                                    |
| `addEventListener` without remove          | HIGH             | Call `removeEventListener` in cleanup                            |
| `setInterval` / `setTimeout` without clear | HIGH             | Call `clearInterval()` / `clearTimeout()` in cleanup             |
| Three.js geom/mat without dispose          | HIGH             | Call `.dispose()` on all geometries and materials in cleanup     |
| Fetch without AbortController              | MEDIUM           | Use AbortController and abort in cleanup                         |
| Event subscription (RxJS, etc.) without    | MEDIUM           | Call `.unsubscribe()` or `.off()` in cleanup                     |
| Global object mutation without cleanup     | MEDIUM           | Reset state or remove mutation in cleanup                        |
| Child component holds parent reference     | MEDIUM           | Use weak refs or clear on unmount                                |

---

## 8. Performance Checklist

Before submitting a PR:

- [ ] All `useEffect` hooks with side effects have a cleanup function
- [ ] AudioContext is closed in cleanup
- [ ] All Three.js geometries/materials are disposed
- [ ] Event listeners are removed on cleanup
- [ ] Timers/intervals are cleared on cleanup
- [ ] `useCallback` is used for event handlers passed to child components
- [ ] `useMemo` is used for expensive computations and objects in dep arrays
- [ ] Child components that don't change are wrapped with `React.memo`
- [ ] No console.log, console.debug, or console.info (only console.error for unrecoverable failures)
- [ ] Bundle size check: `npm run build` succeeds without warning
- [ ] Memory profiler shows no detached DOM nodes or open listeners after unmount
