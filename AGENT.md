# Workspace Agent Notes

This file defines global working rules for the repository.

## Core Rules

- Reuse before creating: always check for existing components, hooks, CSS classes, and utilities before adding new ones.
- If logic, layout structure, interaction wiring, or utility-class chains repeat in 2 or more places, extract them into a shared hook, component, or CSS class.
- Keep wrappers minimal. Every wrapper must provide layout, semantics, scroll boundaries, or state boundaries.
- Prefer Flexbox and Grid for layout. Do not use table layout for page structure.
- Keep top-level UI components focused on composition rather than implementation detail.

## Folder Strategy

- `src/components/ui/`: reusable UI building blocks and feature UI composition.
- `src/hooks/`: reusable hooks organized by responsibility.
- `src/styles/`: shared CSS organized by responsibility.

## Responsive UI Pattern

For UI-heavy features, prefer:

- `common/` for shared shells, controls, types, and constants
- `desktop/` for desktop-specific layout composition
- `mobile/` for mobile-specific layout composition
- thin selector components at the feature root

## Skill Usage

- Use `ui-architecture` for UI structure, reuse boundaries, responsive variant splitting, and component extraction decisions.
- Use `ui-interactions` for interactive controls, hover/tap motion, sound feedback, and accessible action elements.
- Use `code-quality` for lint cleanup, type strictness, duplication cleanup, and validation expectations.
- Use `threejs` when changing React Three Fiber, shaders, scene composition, or rendering-performance-sensitive background code.

## Local Agent Files

When working inside a folder that contains its own `AGENT.md`, follow that local guidance in addition to this file.
Current local folders with their own notes include:

- `src/components/ui/gamedev/`
- `src/components/ui/devops/`
- `src/components/ui/`
- `src/hooks/`
- `src/styles/`
