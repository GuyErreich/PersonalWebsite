---
name: "ui-architecture"
description: "Use when: designing, refactoring, or reviewing UI structure for reuse, responsive variants, and maintainability."
---

# UI Architecture & Reuse Workflow

Use this skill when building or refactoring UI architecture, not just visual details.

## 1. Reuse-First Rule (Mandatory)

- Before creating any new component/hook/style class, search for existing reusable options.
- If an existing primitive covers 80%+ of the need, extend it instead of creating a near-duplicate.
- Prefer consistent naming and composition over one-off custom patterns.

## 2. Extraction Triggers

Extract shared logic immediately when any of these happens:

- The same JSX shell appears in 2+ places.
- The same effect/state orchestration appears in 2+ places.
- The same utility-class chain appears in 2+ places.
- A component exceeds readability due to mixed concerns (data + layout + interactions).

Extraction targets:

- Repeated JSX shell -> shared component in `common/`
- Repeated state/effects -> hook in `src/hooks/<responsibility>/`
- Repeated utility chains -> named classes in `src/styles/components/<feature>.css`

## 3. Folder Architecture for Features

For UI-heavy features, prefer:

- `common/` for shared shells, controls, types, and data constants.
- `desktop/` for desktop-specific layout composition.
- `mobile/` for mobile-specific layout composition.
- feature root selector component that chooses desktop/mobile variants via media-query hook.

Keep selector components thin and declarative.

### Abstraction & Extension Pattern (Required)

- Design reusable base primitives at top-level common boundaries, then extend per feature/section with thin wrappers.
- Use section `common/`, `desktop/`, and `mobile/` wrappers for section theme/behavior differences while preserving shared core logic.
- Reuse section wrappers across responsive variants; avoid duplicating implementation across desktop/mobile files.
- Keep naming consistent with the dominant naming style in each feature domain; avoid introducing alternate suffixes that fragment naming conventions.
- Apply this pattern broadly (pagination, cards, controls, overlays, filter bars, etc.), not just to one UI element type.
- Pagination remains the reference example: global dots + global desktop base, then section wrappers for theme-specific behavior.

### Default Enforcement (Blocking)

- When editing duplicated UI shell/motion/interaction logic, extraction is mandatory in the same change.
- Do not stop at visual parity if the same logic appears elsewhere; refactor to a base primitive + wrappers before finishing.
- Only skip same-change extraction if explicitly instructed by the user to do a minimal one-off patch.

### Start-First Checkpoint (Blocking)

- Before writing implementation code, define the intended base primitive, section wrapper(s), and responsive variant boundaries.
- If section differences are known upfront (theme, spacing, behavior), create section wrappers first and implement through wrappers rather than calling base primitives directly from feature screens.

## 4. Component Design Principles

- Keep top-level components focused on composition, not implementation details.
- Keep wrappers minimal: each container must provide layout, semantics, state boundary, or scroll boundary.
- Use modern layout primitives (Grid/Flex). Do not use table layout for page structure.
- Preserve accessibility and interaction fidelity while refactoring.

## 5. Data & View Separation

- Move data fetching/state orchestration into hooks when UI files become mixed-concern.
- UI components should consume typed props from hooks rather than query APIs directly.
- Keep hooks in responsibility folders (e.g., `hooks/gamedev/`, `hooks/responsive/`).

## 6. Validation Checklist

After architectural refactors:

- `npm run lint` must pass with zero errors.
- `npm run build` must pass.
- Verify no stale duplicate files remain after folder reorganizations.
- Verify imports are updated to new folder boundaries.

## 6.1 No Magic Values Policy (Mandatory)

- Before introducing a numeric CSS/layout value, search for an existing reusable variable/class/token first.
- If the value is already defined in project tokens/variables, reuse it instead of hardcoding.
- If no reusable value exists and the same value appears (or is expected to appear) in 2+ places, create a named reusable token/class in the same change.
- For layout contracts, prefer CSS variables (for example in `:root` or section scope) over repeated literals.
- Do not keep duplicated literals like repeated `1.6rem`, `2rem`, `95%`, or repeated viewport formulas across files.

## 6.2 Hierarchy-First Positioning & Sizing (Mandatory)

- Always solve positioning and sizing at the top-most layout boundary first (section/root/frame level), then let child content conform to those boundaries.
- Do not duplicate the same positioning/sizing intent across multiple nested elements when it can be expressed once at a higher level.
- Overrides for fine-tuning are allowed only after top-level control is in place.
- Apply overrides with a strict hierarchy mindset: try to fix at the highest level first; only go deeper when the higher-level fix cannot achieve the required behavior.
- When going deeper, keep the override scope minimal and document why the top-level boundary was insufficient.

---

## 7. Viewport Layout Model (Mandatory — do not deviate)

This project uses a fixed-navbar viewport layout. Every full-screen section must follow this model consistently. **Never reintroduce nav-clearing padding or percentage heights on sections.**

### The contract

```
:root { --nav-h: 4rem; }   <-- single source of truth for the navbar height
```

The `--nav-h` variable is defined in `src/styles/base.css`. If the navbar height ever changes, update **only this variable** — all layout math recalculates automatically.

### Section shell pattern

Every full-screen section is **a viewport slot only** — no flex, no padding, no centering:

```css
.section-hero, .section-screen, .gamedev-section-shell {
  /* Viewport slot only */
  height: 100svh;
  min-height: 100svh;
  position: relative;
  overflow: hidden;
}
```

### Visible-area frame pattern

All content that must live in the **true visible area** (below the fixed navbar) uses a `.section-frame` child:

```css
.section-frame {
  position: absolute;
  top: var(--section-frame-top, var(--nav-h));
  left: 0;
  right: 0;
  bottom: 0;
}

@media (min-width: 768px) {
  .section-desktop-offset {
    --section-frame-top: calc(var(--nav-h) - var(--section-desktop-lift));
  }
}
```

Place centering flex directly on `.section-frame` or a child of it:

```jsx
<section className="section-hero snap-section">
  {/* backgrounds, edges, overlays go here as absolute elements */}
  <div className="section-frame flex flex-col items-center justify-center">
    {/* card or content */}
  </div>
</section>
```

### Card max-height pattern

Never use `h-[82%]` or percentage heights on cards. Use `max-height` anchored to layout variables:

```css
.card-responsive-wrapper {
  max-height: calc(100svh - var(--nav-h) - var(--section-content-gap));
  overflow: hidden;
}
```

This means:
- Adding/removing padding on the section never changes the card height.
- Centering never drifts.
- The card can never clip or overflow the visible area.

### GameDev content shell

`.gamedev-content-shell` follows the same absolute frame pattern:

```css
.gamedev-content-shell {
  position: absolute;
  top: var(--section-frame-top, var(--nav-h));
  left: 0; right: 0; bottom: 0;
}
```

### Footer

Footer uses `h-[100svh]` as a viewport slot with a `.section-frame` wrapping the inner content, ensuring the content is positioned in the visible area without `pt-18` or similar hacks.

### Anti-patterns (blocked)

| Anti-pattern | Correct replacement |
|---|---|
| `pt-16` / `pt-20` on a section to clear navbar | Use `.section-frame` (its `top: var(--nav-h)` does this) |
| `h-[82%]` on a card inside a section | `max-height: calc(100svh - var(--nav-h) - var(--section-content-gap))` |
| `h-[104svh]` with `!important` overrides | Section is exactly `h-[100svh]`; frame provides the usable area |
| `justify-center` on the section itself | Move centering onto the `.section-frame` child |
| `pt-20 pb-2 md:pt-8 md:pb-6` to create visual room | Use `.section-frame` and apply only minor content padding inside it |
| Hardcoded `64px` or `4rem` anywhere outside `--nav-h` | Always reference `var(--nav-h)` |

### Enforcement rule

When writing or reviewing any full-screen section:
1. Check the section tag has **no padding and no flex** — only `h-[100svh] relative overflow-hidden`.
2. Check visible content lives inside a `.section-frame` (or equivalent) using `top: var(--section-frame-top, var(--nav-h))`.
3. Check card/panel height uses shared variables in `calc(...)` (for example `--section-content-gap`), not percentages.
4. Do not add nav-clearing padding. Do not deviate from this model without updating the model first.
