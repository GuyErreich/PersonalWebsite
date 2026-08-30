# Agent Context (Migrated to Cursor)

GitHub Copilot agent definitions and instructions have been migrated to Cursor, then restructured into a portable agent plugin plus a project overlay. See `.cursor/PLUGIN.md` for the portable-vs-project split.

## Canonical locations

| Former path | New path |
|---|---|
| `.github/copilot-instructions.md` | `.cursor/rules/project/project-guidelines.mdc` + the `AGENT.md` chain |
| `.github/instructions/*.instructions.md` | `.cursor/rules/code/**/*.mdc` + `.cursor/rules/behaviors/*.mdc` |
| `.github/skills/*/SKILL.md` | `.cursor/skills/code/**/SKILL.md` + `.cursor/skills/project/**/SKILL.md` |
| `.github/skills/ui-interactions/SKILL.md` | redirect → `code/web/ux` (see `.cursor/skills/code/web/ux/SKILL.md`) |
| `.github/agents/default.agent.md` | merged into `project/project-guidelines.mdc` + the rules tree |
| `.github/agents/animation-reviewer.agent.md` | removed — folded into `code/web/libs/threejs`, `code/quality/performance`, and `src/lib/AGENT.md` |
| `.github/instructions/pr-review.instructions.md` | `.cursor/skills/code/review/pr-resolver/SKILL.md` |
| `.github/prompts/create-r3f-component.prompt.md` | `.cursor/skills/code/web/libs/threejs/assets/r3f-component-template.tsx` |

## Skill layout

```
.cursor/skills/
├── foundations/hierarchy       domain-agnostic folder taxonomy
├── ai-agent/
│   ├── hierarchy               agent container tiers (deepen vs widen)
│   └── improvement-protocol    skill/rule maintenance
├── code/                       PORTABLE plugin core
│   ├── foundations/engineering   universal base (all code skills extend it)
│   ├── languages/nodejs          TypeScript / JS syntax + tooling
│   ├── web/ui                    UI structure, reuse, accessibility
│   ├── web/ux                    motion, press, overlays, generative sound
│   ├── web/libs/react            hooks, components, GSAP
│   ├── web/libs/threejs          R3F, shaders, disposal (+ component template asset)
│   ├── quality/performance       memory + render performance
│   ├── quality/security          vulnerability prevention
│   ├── review/reviewer           single-pass code reviewer
│   ├── review/pr-resolver        controlled PR-thread resolution loop
│   └── ci/{worktree,commit,issue,pr,push,local-review-loop,pr-review-loop}
└── project/                    PROJECT overlay (not exported)
    └── platform/                 supabase, supabase-branch-testing, deploy-secrets
```

## Rules layout

```
.cursor/rules/
├── foundations/hierarchy  (always apply)
├── ai-agent/    hierarchy (glob: .cursor markdown)
├── behaviors/   git-push-consent, git-commit-consent, code-review-gate (always apply)
├── code/        glob rules mirroring the code skill tree (load matching skills)
└── project/     project-guidelines
```

## Usage in Cursor

- **Rules** apply automatically based on file globs or `alwaysApply: true`; `foundations/hierarchy.mdc` and `code/foundations/engineering.mdc` always apply.
- **Skills** load on demand — attach or `@`-mention them (for example `@reviewer`, `@pr-resolver`, `@supabase`).
- **`AGENT.md`** files carry project context; read the nearest one (leaf → root) when working in a folder.

The `.github/skills/` and `.github/instructions/` directories are retained for GitHub Copilot compatibility but are no longer the source of truth.
