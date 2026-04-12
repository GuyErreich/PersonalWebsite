# GameDev UI Agent Notes

Use this folder for GameDev-specific UI composition.

## Rules

- Check `common/` before creating any new panel shell, button, intro block, shared type, or utility component.
- Put shared building blocks in `common/`.
- Put desktop-only layout composition in `desktop/`.
- Put mobile-only layout composition in `mobile/`.
- Keep `GameDevOverviewPanel.tsx` and `GameDevAllProjectsPanel.tsx` as thin selector components.
- If logic duplication appears across variants, extract it into a shared hook under `src/hooks/<responsibility>/`.
- If long class chains repeat, move them into `src/styles/components/gamedev.css`.
- Do not add extra wrappers unless they provide layout, semantics, scroll boundaries, or state boundaries.

## Skill Usage

- Use `ui-architecture` for folder structure, common/desktop/mobile boundaries, panel extraction, and selector thinning.
- Use `ui-interactions` for panel buttons, motion feedback, and sound behavior.
- Use `code-quality` for duplication removal, type cleanup, and validation during refactors.
