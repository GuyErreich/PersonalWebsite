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
const hoverAudio = useRef<{
  ctx: AudioContext;
  osc: OscillatorNode;
  gain: GainNode;
} | null>(null);
```

### Browser-vendor API extensions — extend the `Window` interface inline:

```ts
const AudioCtx =
  window.AudioContext ||
  (window as Window & { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
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
const {
  progress,
  entryDelay: _entryDelay,
  activeT: _activeT,
} = getImplosionState(t);
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
  console.warn("AudioContext resume failed:", err);
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

| File exports                  | Place it in                                       |
| ----------------------------- | ------------------------------------------------- |
| React component only          | `.tsx` file                                       |
| Context + hook (no component) | `.ts` file, or a separate `.tsx` if JSX is needed |
| Shared constants / config     | `.ts` file                                        |
| Component provider wrapper    | Its own `FooProvider.tsx` file                    |

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

## 9. Fail-Fast & Proper Exception Handling

**Rule: code that can fail MUST fail loudly at the point of failure, not silently downstream.**

Three allowed patterns — pick based on context:

### Pattern A — Optional browser-API (AudioContext, WebGL): silent suppression with annotation

```ts
try {
  const ctx = new AudioContext();
  // ... audio synthesis
} catch {
  // intentional — AudioContext not supported in this environment
}
```

### Pattern B — System boundary (Supabase / fetch / data): always check the returned error field and surface it

```ts
// Supabase returns { data, error } — never throws. Always check `error`.
const {
  data: { session },
  error,
} = await supabase.auth.getSession();
if (error || !session) {
  navigate("/login");
  return;
}

// For mutations surface the error to the user:
const { error } = await supabase.from("items").insert(payload);
if (error) {
  setError(error.message);
  return;
}
```

### Pattern C — Re-throw after logging

If you catch to log, always re-throw so callers still know it failed:

```ts
try {
  await riskyOperation();
} catch (err) {
  console.error("riskyOperation failed:", err);
  throw err; // or: throw new Error('riskyOperation failed', { cause: err });
}
```

### What is NEVER acceptable:

```ts
} catch (e) {}                         // silent swallow — use catch { // intentional } instead
} catch (err) { console.log(err); }   // log without propagating in system-critical code

// Supabase without error check — unknown failures silently pass through:
const { data: { session } } = await supabase.auth.getSession();
if (!session) navigate('/login');      // ← misses network / auth errors
```

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

## 11. Console Logging in Production

**Biome config:** `noConsole` is enabled with `allow: ["error", "warn"]`. Any `console.log`, `console.debug`, `console.info`, etc. is a lint error.

### What is allowed and why

| Call | When allowed |
|---|---|
| `console.error(...)` | Unrecoverable browser API failures (GLSL shader errors, WebGL link errors) |
| `console.warn(...)` | Expected browser API degradation (AudioContext, WebGL not supported) |

Everything else (`console.log`, `console.debug`, `console.info`, `console.table`, etc.) is **forbidden** — it leaks internal state and clutters DevTools in production.

### Safe error logging — log message only, not the raw error object

Raw error objects can embed user input or sensitive content in their stack trace.

**Bad — dumps entire Error object (may include markdown source, request body, etc.):**
```ts
.catch((e) => console.error(e));
```

**Good — extract only the safe `.message` string:**
```ts
.catch((e: unknown) =>
  console.error(
    "[ComponentName] Operation failed:",
    e instanceof Error ? e.message : String(e),
  ),
);
```

### Where console.error/warn already live (audit baseline)

- `SignalWaveEdge`, `NebulaEdge`, `MeteorEdge` — GLSL shader compile/link errors (safe: no user data)
- `ReverseHyperspace`, `HyperspaceLever`, `Hero` — Web Audio API not supported (safe: generic DOMException)
- `useCameraRumbleSound`, `useRewindSound` — audio synthesis failures (safe: fixed strings)
- `MarkdownRenderer` — Mermaid render failure — logs `e.message` only (fixed to be safe)

If you add a new `console.error/warn`, ensure it logs only a fixed string or `e.message`, never the raw Error object or any value derived from user input or network responses.

---

## 12. DRY — No Duplication Across Files

Any logic copy-pasted across two or more files MUST be extracted into a shared utility in `src/lib/`.

**Rule: one implementation, imported everywhere.**

### Identifying duplication

- Identical or near-identical functions (same signature, same body, only a string label differs)
- Shared WebGL boilerplate, audio helpers, math utilities, type guards

### Where to put it

| What it is | Where it goes |
|---|---|
| WebGL shader/program helpers | `src/lib/webgl.ts` |
| Audio synthesis helpers | `src/lib/sound/` |
| Math / colour utilities | `src/lib/` (descriptive name) |
| Shared React hooks | `src/hooks/` |

### Parameterise instead of copy

When functions differ only by a label string or a constant, add a parameter:

**Bad — three files each with their own copy:**
```ts
// MeteorEdge.tsx
function createProgram(gl) { ... console.error("[MeteorEdge] ...") ... }

// SignalWaveEdge.tsx
function createProgram(gl) { ... console.error("[SignalWaveEdge] ...") ... }

// NebulaEdge.tsx
function createProgram(gl) { ... console.error("[NebulaEdge] ...") ... }
```

**Good — one function, parameterised label, imported everywhere:**
```ts
// src/lib/webgl.ts
export function buildGlProgram(gl, vert, frag, label) { ... console.error(`[${label}] ...`) ... }

// MeteorEdge.tsx
import { buildGlProgram } from "../../../lib/webgl";
const prog = buildGlProgram(gl, VERT, FRAG, "MeteorEdge");
```

### Before creating any new helper

1. Search `src/lib/` — does a similar utility already exist?
2. Search `src/components/` — is the same logic already in another component?
3. If found in >1 place: extract to `src/lib/` immediately, do not leave the duplication.

---

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

---

## 13. Async / Await Over Promise Chains

**Rule: always use `async/await` — never `.then()/.catch()` chains.**

Promise chains hide control flow and make error handling easy to get wrong. Every place a `.then()` or `.catch()` appears must be converted to an `async` function with `try/catch`.

### In plain async functions

**Bad:**
```ts
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    if (session) navigate("/management");
  })
  .catch(() => { /* ignore */ });
```

**Good:**
```ts
try {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) navigate("/management");
} catch {
  // intentional — network failure; user stays on current page
}
```

### Inside `useEffect` (cannot be async directly)

Wrap in an async IIFE and prefix with `void` to tell the linter the returned Promise is intentionally not awaited:

**Bad:**
```ts
useEffect(() => {
  fetchData()
    .then((result) => setState(result))
    .catch((e) => console.error(e));
}, []);
```

**Good:**
```ts
useEffect(() => {
  void (async () => {
    try {
      const result = await fetchData();
      setState(result);
    } catch (e: unknown) {
      console.error("fetchData failed:", e instanceof Error ? e.message : String(e));
    }
  })();
}, []);
```

### Mixing async callback + chained `.then()` (e.g. library APIs)

If a library takes an async callback and returns a Promise, await the whole call — do not chain `.then()` on the outside:

**Bad:**
```ts
initParticlesEngine(async (engine) => {
  await loadSlim(engine);
}).then(() => {
  setInit(true);
});
```

**Good:**
```ts
void (async () => {
  await initParticlesEngine(async (engine) => {
    await loadSlim(engine);
  });
  setInit(true);
})();
```

### One-liner optional browser-API calls (AudioContext resume/close)

For fire-and-forget calls where the Promise rejection is intentionally suppressed, use `void` + `.catch(() => {})` — do **not** chain `.then()`:

```ts
// resume — fire and forget
void ctx.resume().catch(() => {}); // intentional

// close in cleanup — fire and forget
void ctx.close().catch(() => {}); // intentional
```

### Summary table

| Situation | Pattern |
|---|---|
| Regular async function | `async function + await + try/catch` |
| `useEffect` with async work | `void (async () => { ... })()` |
| Library API with async callback + post-step | `await` the whole call, then next line |
| Fire-and-forget browser API (audio resume/close) | `void promise.catch(() => {}) // intentional` |
