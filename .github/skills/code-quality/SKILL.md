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

## 6. Fast Refresh — One Concern Per File

`react-refresh/only-export-components` warns when a file exports both a React component and a non-component (context object, constant, hook, utility). This prevents React Fast Refresh from doing a partial hot-reload and causes the full page to reload instead.

**Rule: always split mixed-export files.**

| File exports | Place it in |
|---|---|
| React component only | `.tsx` file |
| Context + hook (no component) | `.ts` file, or a separate `.tsx` if JSX is needed |
| Shared constants / config | `.ts` file |
| Component provider wrapper | Its own `FooProvider.tsx` file |

**Example — wrong:**
```tsx
// AnimationContext.tsx — mixes context, component, and hook
export const AnimationContext = createContext(...);   // non-component
export const AnimationProvider = (...) => <...>;     // component ⚠️
export const useOrchestrator = () => { ... };        // non-component
```

**Example — correct:**
```tsx
// AnimationContext.tsx — context + hook only (no component, no warning)
export const AnimationContext = createContext(...);
export const useOrchestrator = () => { ... };

// AnimationProvider.tsx — component only (no warning)
export const AnimationProvider = (...) => <...>;
```

Do **not** suppress with `// eslint-disable`. Fix by splitting the file.

---

## 7. Unused npm Dependencies

Unused packages in `package.json` waste install time and inflate the bundle. Before adding a dependency — and before committing — verify it is actually imported somewhere in `src/`.

```bash
# Quick check — should return results if the package is used
grep -r "from 'some-package'" src/
```

If a package appears in `package.json` but has no imports, remove it:
```bash
npm uninstall some-package
```

This applies to both `dependencies` and `devDependencies`.

---

## 8. Validation Checklist Before Committing

Run these two commands and ensure both pass with zero errors:
```bash
npm run lint   # ESLint + TypeScript-aware rules
npm run build  # tsc -b + vite build (full type-check)
```

- `npm run lint`: 0 errors (warnings from `react-refresh` in the two known files are acceptable)
- `npm run build`: must succeed — any TypeScript error blocks the build

---

## 9. File Size & Component Splitting

Keep component files under ~150 lines. When a file grows beyond that, split it:

- Extract each logical sub-component into its own file (e.g. `GameDevOverlay.tsx`, `DevOpsOverlay.tsx`)
- Extract shared utilities (audio helpers, math helpers) into `.ts` files under `src/lib/`
- Never leave helper components defined in the same file as a parent if they are non-trivial

**Before creating anything new:**
1. Search `src/components/` for an existing component that does the same thing
2. Search `src/lib/` for an existing utility/hook
3. Check `src/index.css` `@layer components` for an existing CSS class

Only create something new if nothing reusable already exists.

---

## 10. CSS Classes Over Inline Styles

Prefer `@layer components` CSS classes in `src/index.css` over `style={{}}` props.

**When to use a CSS class:**
- Any `style` property that appears more than once in the codebase
- Background gradients, repeating patterns (scanlines), complex shadows
- Anything that could be reused across components

**Bad:**
```tsx
<div style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)' }} />
<div style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.07) 0%, transparent 65%), #030712' }} />
```

**Good — define once in `index.css`, use everywhere:**
```css
@layer components {
  .scanlines {
    @apply absolute inset-0 pointer-events-none z-10;
    background-image: repeating-linear-gradient(...);
  }
  .overlay-bg-devops {
    background: radial-gradient(...), #030712;
  }
}
```
```tsx
<div className="scanlines" aria-hidden />
<motion.div className="overlay-backdrop overlay-bg-devops">
```

**Exceptions — keep `style={{}}` for:**
- Values computed at runtime (e.g. `style={{ width: progress + '%' }}`)
- Framer Motion `style` prop bound to `MotionValue`
- One-off layout values with no reuse (e.g. `style={{ gap: 'clamp(2px, 0.4vw, 8px)' }}`)

## 9. ESLint Config Conventions (eslint.config.js)

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
