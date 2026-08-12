<!--
  ~ Copyright (c) 2026 Guy Erreich
  ~
  ~ SPDX-License-Identifier: MIT
-->

# GameDev UI Agent Notes

Use this folder for GameDev-specific UI composition.

## Rules

- Check `common/` before creating any new panel shell, button, intro block, shared type, or utility component.
- Put shared building blocks in `common/`.
- Put desktop-only layout composition in `desktop/`.
- Put mobile-only layout composition in `mobile/`.
- Keep `GameDevOverviewPanel.tsx` and `GameDevAllProjectsPanel.tsx` as thin selector components.
- If logic duplication appears across variants, extract it into a shared hook under `src/hooks/<responsibility>/`.
- If long class chains repeat, move them into `src/styles/components/gamedev/` (shared in `base.css`, desktop-only in `desktop.css`, mobile-only in `mobile.css`).
- Do not add extra wrappers unless they provide layout, semantics, scroll boundaries, or state boundaries.

## VFX media contract (mandatory — do not regress)

Public VFX pickers (`GameDevVfxSlider`, `GameDevProjectVfxSection`) must support all library media types:

| Type | Storage | Render |
|---|---|---|
| Static image | `media_type: "image"` | `<img src={media_url}>` |
| Animated GIF | `media_type: "image"` (GIF URL) | `<img>` — browser animates |
| Looping video | `media_type: "video"` | Muted `<video loop playsInline>` on hero and **active** thumb |

**Performance rule:** never fix thumb-rail cost by making the whole rail image-only. Inactive video thumbs may use poster `<img>` when `thumbnail_url` is set, or a paused `<video preload="metadata">` with `seekThumbnailToVideoCenter` when it is not — **never** `<img src={video media_url}>`. The **selected** thumb and hero must still play looping video.

**Shared primitive:** use `GameDevVfxMedia` from `common/media/GameDevVfxMedia.tsx` for every VFX hero and thumb surface. Do not duplicate `VfxLoopVideo` or poster-vs-video branching in feature components.

## Skill Usage

- Use `code/web/ui` for folder structure, common/desktop/mobile boundaries, panel extraction, and selector thinning.
- Use `project/ui-interactions` for panel buttons, motion feedback, and sound behavior.
- Use `code/foundations/engineering` for duplication removal and `code/languages/nodejs` for type cleanup and validation during refactors.
