# Workspace Agent Notes

This file defines global working rules for the repository.

## Core Rules

- Reuse before creating: always check for existing components, hooks, CSS classes, and utilities before adding new ones.
- If logic, layout structure, interaction wiring, or utility-class chains repeat in 2 or more places, extract them into a shared hook, component, or CSS class.
- Avoid magic values. Reuse existing variables/tokens/classes first; if a needed value appears in 2+ places, create a shared variable/class in the same change.
- Solve positioning and sizing at the top-most layout boundary first (section/root/frame), and let content conform to it. Only add deeper overrides for fine tuning when a higher-level fix cannot satisfy the requirement.
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

## Abstraction & Extension Pattern

- Treat repeated UI logic as a base abstraction first, then extend per feature/section.
- Place global base primitives in top-level common folders (for example `src/components/ui/common/` and `src/components/ui/common/desktop/`).
- Create thin section wrappers in section `common/`, `desktop/`, and `mobile/` folders to apply section-specific theme, naming, and behavior.
- Reuse section wrappers across responsive variants instead of duplicating implementation logic.
- Keep naming consistent with the dominant domain naming in that feature. Avoid introducing alternate suffixes (for example `*Controls`) when a clearer domain naming already exists.
- Pagination is one example of this pattern, not a special-case exception.

## Mandatory Refactor Default

- If you touch duplicated UI shell, motion, or interaction logic, extraction to base abstraction + section wrappers is required in the same change.
- Do not leave matched behavior implemented as duplicated code paths unless the user explicitly requests a minimal temporary patch.

## Upfront Architecture Checkpoint

- Before implementing UI changes, decide and state the target split: global base primitive, section wrapper(s), and responsive variant composition.
- Create or wire section wrappers first when section differences are known (theme, spacing, behavior), then implement through wrappers instead of direct base usage in feature screens.

## Validate

- Base branch for branch/PR diffs: `dev`.
- Lint: `npm run lint` — 0 errors required.
- Build / type-check: `npm run build` (`tsc -b && vite build`) — must succeed.
- Dev server: `npm run dev`.

Reviewer and CI skills read these commands and the base branch from this block.

## Review scope

When reviewing, always materialize the full surface: the tier diff (for PR/push prefer `merge-base...HEAD` against `dev`), plus the nearest `AGENT.md` for every changed path (leaf → root), plus the skills routed by the changed file types.

## Skill Usage

- `code/web/ui` for UI structure, reuse boundaries, responsive variant splitting, and component extraction decisions.
- `project/ui-interactions` for interactive controls, hover/tap motion, sound feedback, and accessible action elements.
- `code/languages/nodejs` for type strictness, lint cleanup, and async/await discipline; `code/foundations/engineering` for duplication and structure.
- `code/web/libs/react` for hooks, component structure, and GSAP integration.
- `code/web/libs/threejs` when changing React Three Fiber, shaders, scene composition, or rendering-performance-sensitive background code.
- `project/platform/supabase` for backend, auth, and data access.

## Viewport Layout Model (Mandatory — never bypass)

This project uses a fixed-navbar layout contract. All full-screen sections must follow it:

- **One source of truth**: `--nav-h: 4rem` in `src/styles/base.css`. Never hardcode `64px` or `4rem` elsewhere.
- **Section shells are viewport slots only**: `h-[100svh] relative overflow-hidden`. No `flex`, no `padding`, no centering.
- **Visible-area frame**: all content that must sit below the navbar uses `.section-frame` (or equivalent `position: absolute; top: var(--nav-h); left:0; right:0; bottom:0`). Do not use `pt-16` / `pt-20` on sections to clear the navbar.
- **Card/panel height**: use `max-height: calc(100svh - var(--nav-h) - Xrem)`, not `h-[82%]` or other viewport percentages.
- **Centering**: belongs on the `.section-frame` child (`flex items-center justify-center`), never driven by section padding.

Violating this pattern causes centring drift, overflow, and blank-space bugs that cascade across screen sizes. This viewport contract is project-specific; the generic UI structure rules live in `code/web/ui`.

## Local Agent Files

When working inside a folder that contains its own `AGENT.md`, follow that local guidance in addition to this file.
Current local folders with their own notes include:

- `src/components/ui/gamedev/`
- `src/components/ui/devops/`
- `src/components/ui/`
- `src/hooks/`
- `src/styles/`
