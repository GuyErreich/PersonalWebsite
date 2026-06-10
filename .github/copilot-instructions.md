# Portfolio Project Guidelines

This is a React + TypeScript + Vite project using Tailwind CSS v4, Three.js (React Three Fiber), GSAP, and Supabase.

> **Canonical agent context** lives in `.cursor/rules/` and `.cursor/skills/`. This file is kept for GitHub Copilot compatibility — prefer Cursor rules/skills when using Cursor.

> **Note:** This document is continuously improved. See [`.cursor/skills/meta/improvement-protocol/SKILL.md`](../.cursor/skills/meta/improvement-protocol/SKILL.md) for how suggestions are flagged, discussed, and implemented in parallel sessions.

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

## Code Conventions

**General:**
- Functional components with React Hooks
- Type-safe TypeScript (no `any`)
- Reuse before creating — always search before adding new components/hooks/styles
- Complex visual code lives in respective subdirectories (e.g., Three.js → `components/backgrounds/three/`)

**UI & Architecture:**
- See [`.cursor/skills/frontend/ui-architecture/SKILL.md`](../.cursor/skills/frontend/ui-architecture/SKILL.md) for reuse boundaries, responsive patterns, and component extraction
- Leverage `AnimationOrchestrator` / `AnimationContext` (`src/lib/`) for complex sequences
- Block separation: logical groups separated by blank lines (config → state → derived → effects → handlers → return)

**Code Quality & TypeScript:**
- See [`.cursor/skills/quality/code-quality/SKILL.md`](../.cursor/skills/quality/code-quality/SKILL.md) for lint rules, typing patterns, error handling, and validation

## Quality Standards

**Rules (zero tolerance):**
- No duplication: Extract to `src/lib/` or shared components
- No UI duplication: Extract to shared components/hooks/CSS
- No `any`, `@ts-nocheck`, bare `catch (e) {}`, or silent failures
- No `console.log/debug/info` (only `console.error/warn` for system failures)
- Unused variables → prefix with `_` or remove
- All hook deps included in dependency arrays
- Async/await only (never `.then()/.catch()` chains)

**Before committing:**
- `npm run lint` → 0 errors
- `npm run build` → succeeds
- See [`.cursor/skills/quality/code-quality/SKILL.md`](../.cursor/skills/quality/code-quality/SKILL.md) for patterns and examples

## Cursor Rules & Skills Map

| Domain | Cursor rule | Skill path |
|---|---|---|
| Core | `.cursor/rules/project-guidelines.mdc` | always-on |
| Quality | `.cursor/rules/code-quality.mdc` | `quality/code-quality` |
| UI | `.cursor/rules/ui-interactions.mdc` | `frontend/ui-interactions` |
| Architecture | `.cursor/rules/ui-architecture.mdc` | `frontend/ui-architecture` |
| 3D | `.cursor/rules/threejs.mdc` | `frontend/threejs` |
| Security | `.cursor/rules/security.mdc` | `quality/security` |
| Performance | `.cursor/rules/performance.mdc` | `quality/performance` |

Workflow skills: `review/code-review`, `review/pr-review`, `review/animation-review`, `platform/supabase`, `platform/supabase-branch-testing`, `frontend/create-r3f-component`, `meta/improvement-protocol`
