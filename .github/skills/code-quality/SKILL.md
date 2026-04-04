---
name: "code-quality"
description: "Use when: fixing lint errors, TypeScript type issues, removing any types, removing ts-nocheck, fixing unused variables, fixing empty catch blocks, or validating code quality before committing."
---

# Code Quality Skill

This project enforces strict TypeScript and ESLint standards. Apply this skill whenever validating, fixing, or writing code that needs to pass `npm run lint` and `npm run build` with zero errors.

---

## 1. TypeScript — Never Use `any`

Always use specific types. If none exists, create a named interface or type alias.

**Forbidden:**
```ts
const ref = useRef<any>(null);
(window as any).webkitAudioContext;
shapes: any[]
```

**Correct patterns:**

### Refs — always provide the exact element/object type:
```ts
const ref = useRef<THREE.Mesh>(null);
const hoverAudio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);
```

### Browser-vendor API extensions — extend the `Window` interface inline:
```ts
const AudioCtx =
  window.AudioContext ||
  (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
```

### Component prop shapes — always define an interface:
```ts
interface OrbitShape {
  x: number;
  z: number;
  angle?: number;
}

// Then use it:
forwardRef<THREE.Group, { shapes: OrbitShape[]; visible: boolean }>(...)
```

### Three.js material access — always cast to the concrete material type:
```ts
const mat = meshRef.current.material as THREE.ShaderMaterial;
mat.uniforms.uOpacity.value = 0.5;
```

---

## 2. Never Use `@ts-nocheck`

`@ts-nocheck` silently disables all type checking. Fix the underlying type issues instead.

Common fixes that replace the need for `@ts-nocheck`:
- Type all function parameters explicitly (`t: number` not `t`)
- Cast `material` to `THREE.ShaderMaterial` / `THREE.MeshStandardMaterial` before accessing uniforms
- Remove unused imports that were suppressed by `@ts-nocheck`

---

## 3. Unused Variables

- Prefix intentionally unused variables with `_` — ESLint ignores `_`-prefixed names.
- Remove imports that are never referenced.
- If a destructured value is unused, either omit it or prefix with `_`:

```ts
// Bad
const { progress, entryDelay, activeT } = getImplosionState(t); // entryDelay, activeT unused

// Good
const { progress } = getImplosionState(t);

// Or if you must destructure:
const { progress, entryDelay: _entryDelay, activeT: _activeT } = getImplosionState(t);
```

---

## 4. Empty Catch Blocks

ESLint forbids empty `catch(e) {}` by default. Two acceptable patterns:

**Intentional suppression (e.g., audio API graceful degradation) — omit the binding:**
```ts
try {
  // ...audio API code that may throw on unsupported browsers
} catch {
  // intentionally empty — AudioContext not supported
}
```

**When you need to log/debug — use the error:**
```ts
try {
  ctx.resume();
} catch (err) {
  console.warn('AudioContext resume failed:', err);
}
```

**Never do this** (triggers both `no-empty` and `no-unused-vars`):
```ts
} catch (e) {}
```

---

## 5. React Hook Dependency Arrays

Always include all variables referenced inside a `useEffect` or `useCallback` in the dependency array. ESLint's `react-hooks/exhaustive-deps` rule will flag missing dependencies.

```ts
// Bad — thoughtsLength is used but missing from deps
useEffect(() => {
  // ... uses thoughtsLength
}, [skipIntro]);

// Good
useEffect(() => {
  // ... uses thoughtsLength
}, [skipIntro, thoughtsLength]);
```

---

## 6. Fast Refresh Warnings (`react-refresh/only-export-components`)

These are **warnings**, not errors. They appear when a file exports both a React component and a non-component (e.g., a context or constant). The project intentionally accepts these in:
- `src/lib/AnimationContext.tsx` (exports context + hook)
- `src/components/backgrounds/tsparticles/ParticlesBase.tsx` (exports config constant + component)

Do **not** restructure these files unless explicitly asked. Do not suppress the warnings with `// eslint-disable`.

---

## 7. Validation Checklist Before Committing

Run these two commands and ensure both pass with zero errors:
```bash
npm run lint   # ESLint + TypeScript-aware rules
npm run build  # tsc -b + vite build (full type-check)
```

- `npm run lint`: 0 errors (warnings from `react-refresh` in the two known files are acceptable)
- `npm run build`: must succeed — any TypeScript error blocks the build

---

## 8. ESLint Config Conventions (eslint.config.js)

The project's ESLint config enforces:
```js
'no-empty': ['error', { allowEmptyCatch: true }],
'@typescript-eslint/no-unused-vars': [
  'error',
  {
    varsIgnorePattern: '^_',
    argsIgnorePattern: '^_',
    destructuredArrayIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  },
],
```

Do **not** add `// eslint-disable` suppression comments as a fix. Fix the actual issue instead.
