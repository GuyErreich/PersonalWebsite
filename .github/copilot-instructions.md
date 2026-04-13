# Portfolio Project Guidelines

This is a React + TypeScript + Vite project using Tailwind CSS v4, Three.js (React Three Fiber), GSAP, and Supabase.

## Code Style & Stack

- **Frameworks**: React 19, TypeScript, Vite.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`).
- **3D & Animations**:
  - Three.js via `@react-three/fiber` and `@react-three/drei` (see `src/components/backgrounds/three/`).
  - GSAP for complex DOM animations.
  - Framer Motion for additional UI transitions.
  - `tsparticles` for 2D particle effects.
- **State & Data**: Supabase for backend/database (see `src/lib/supabase.ts`).
- **Icons**: `lucide-react`.
- **Routing**: `react-router-dom`.

## Architecture

- **`src/components/`**: Reusable UI components. Subdivided into functional areas like `backgrounds/` (for 3D and particle effects), `ui/`, and `admin/`.
- **`src/pages/`**: Main route components (`Home.tsx`, `Admin.tsx`, `Login.tsx`).
- **`src/lib/`**: Utilities, contexts (`AnimationContext.tsx`, `AnimationOrchestrator.ts`), and Supabase configuration/storage clients.
- **`src/hooks/`**: Reusable hooks organized by responsibility (for example `hooks/gamedev/`, `hooks/responsive/`). Do not place reusable hooks inside component folders.
- **`src/styles/`**: Shared styles organized by responsibility. Put defaults in base files and shared reusable block classes in component-specific CSS files.

## Build and Test

- **Development Server**: run `npm run dev`
- **Build**: run `npm run build` (executes `tsc -b && vite build`)
- **Linting**: run `npm run lint`

## Conventions

- Use functional components with React Hooks.
- Ensure type safety with TypeScript; avoid `any` wherever possible.
- Leverage the `AnimationOrchestrator` / `AnimationContext` in `src/lib/` for coordinating complex sequence animations across the site.
- Separate complex visual components into their respective subdirectories (e.g., Three.js specific code lives in `components/backgrounds/three/`).
- Reuse before creating: always search for an existing component, hook, or CSS class before adding a new one. Extend shared primitives when possible instead of creating near-duplicates.
- For responsive UI, split shared building blocks from layout variants. Prefer `common/`, `desktop/`, and `mobile/` folders with thin selector components at the feature root.
- Keep JSX focused on composition. Move repeated layout shells, interactive button logic, and long class chains into reusable components or named CSS classes.
- Prefer a small number of meaningful container/wrapper layers. Do not add nested wrappers unless they provide a clear layout, semantics, or state boundary.
- Use `.github/skills/ui-architecture/SKILL.md` when planning or reviewing feature-level UI structure and reuse boundaries.
- **Block separation**: Within function/component bodies, separate distinct logical groups with a blank line. Standard order: responsive config → state & refs → derived values → effects → handlers → return. Always add a blank line before `return`. Never add blank lines *within* a tightly-related group (e.g. consecutive `useState` calls in the same group). Add a blank line between sibling handler functions. The same rule applies inside JSX: add a blank line between each logically distinct sibling element or element group (background layer, overlay, section edge, main content, navigation controls, etc.).

## TypeScript & Lint Rules (enforced — zero tolerance)

- **No duplication**: Any function copy-pasted across two or more files MUST be extracted to `src/lib/`. Parameterise the differing parts (e.g., a label string) instead of copying. See `.github/skills/code-quality/SKILL.md` §12.
- **No UI duplication**: If layout structure, interaction wiring, or long utility-class chains are repeated across two or more UI files, extract them into a shared component, hook, or CSS class before continuing feature work.
- **No `any`**: Use specific types or define a named `interface`/`type`. For vendor browser APIs use `(window as Window & { webkitAudioContext?: typeof AudioContext })` — never `(window as any)`.
- **No `@ts-nocheck`**: Fix the underlying type issue instead. Add parameter types, cast materials to their concrete class (e.g., `THREE.ShaderMaterial`), and remove unused imports.
- **No bare `catch (e) {}`**: Use `catch { }` (no binding) for intentional suppression, or log the error.
- **Fail-fast**: Never silently swallow failures in system logic. For Supabase/fetch calls always check the returned `error` field (`if (error) { setError(error.message); return; }`). Only use bare `catch { }` for optional browser-API calls (AudioContext, WebGL) and annotate with `// intentional`. If you catch to log, re-throw so callers still know it failed. See `.github/skills/code-quality/SKILL.md` §9 for all three patterns.
- **No `console.log/debug/info`**: These are lint errors (`noConsole` is enforced). Only `console.error` and `console.warn` are allowed, and only for unrecoverable browser-API failures (GLSL errors, AudioContext not supported). When logging a caught error always use `e instanceof Error ? e.message : String(e)` — never dump the raw error object. See `.github/skills/code-quality/SKILL.md` §11.
- **Unused variables**: Prefix with `_` (e.g., `_skipIntro`) or remove entirely. Never suppress with `eslint-disable`.
- **Hook deps**: Always include every referenced variable in `useEffect`/`useCallback` dependency arrays.
- **Async/await only**: Never use `.then()/.catch()` chains. Use `async/await` with `try/catch` everywhere. Inside `useEffect`, wrap async work in `void (async () => { ... })()`. For fire-and-forget browser APIs (AudioContext resume/close) use `void promise.catch(() => {}) // intentional`. See `.github/skills/code-quality/SKILL.md` §13.
- **Validation**: Run `npm run lint` (0 errors) and `npm run build` (must succeed) before committing.
- See `.github/skills/code-quality/SKILL.md` for full patterns and examples.
