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

## Build and Test
- **Development Server**: run `npm run dev`
- **Build**: run `npm run build` (executes `tsc -b && vite build`)
- **Linting**: run `npm run lint`

## Conventions
- Use functional components with React Hooks.
- Ensure type safety with TypeScript; avoid `any` wherever possible.
- Leverage the `AnimationOrchestrator` / `AnimationContext` in `src/lib/` for coordinating complex sequence animations across the site.
- Separate complex visual components into their respective subdirectories (e.g., Three.js specific code lives in `components/backgrounds/three/`).
