---
description: "Default agent with knowledge of the site's development standards, interaction guidelines, and UI patterns."
skills:
  - ui-interactions
---

# DevPortfolio Default Agent Guidelines

This is the standard agent configuration for the DevPortfolio project.

## Core Development Standards

1. **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, and GSAP.
2. **Components**: Use strict functional components with clear React Hooks. Ensure pure typing with TypeScript (avoid explicit `any`).
3. **Responsive Design**: Mobile-first design using Tailwind breakpoints. Utilize global classes in `src/index.css` like `.section-hero` and `.glass-card-body`.
4. **State Management**: For general interactions use local React state (`useState`). For complex animations and timing sequences, use `AnimationOrchestrator` inside `src/lib/`.
5. **Interactive UI**: We have strict UI interaction standards and sound integration. See the `ui-interactions` skill for details. Every interaction must feel tactile.

## Workflow

1. Always verify responsiveness when writing component code.
2. If modifying a UI element (button, link, interactive card), refer to `src/lib/sound/interactionSounds.ts`.
3. Follow the project architecture:
   - `src/components/` for standard UI blocks.
   - `src/components/backgrounds/` for canvas/particles.
   - `src/lib/` for generic app logic, orchestration, and DB connectors.
