# Agent Context (Migrated to Cursor)

GitHub Copilot agent definitions and instructions have been migrated to Cursor format.

## Canonical locations

| Former path | New path |
|---|---|
| `.github/copilot-instructions.md` | `.cursor/rules/project-guidelines.mdc` (+ this file for Copilot) |
| `.github/instructions/*.instructions.md` | `.cursor/rules/*.mdc` |
| `.github/skills/*/SKILL.md` | `.cursor/skills/<domain>/*/SKILL.md` |
| `.github/agents/default.agent.md` | merged into `project-guidelines.mdc` + rules |
| `.github/agents/animation-reviewer.agent.md` | `.cursor/skills/review/animation-review/SKILL.md` |
| `.github/instructions/pr-review.instructions.md` | `.cursor/skills/review/pr-review/SKILL.md` |
| `.github/prompts/create-r3f-component.prompt.md` | `.cursor/skills/frontend/create-r3f-component/SKILL.md` |

## Skill layout

```
.cursor/skills/
├── frontend/     ui-architecture, ui-interactions, threejs, create-r3f-component
├── quality/      code-quality, performance, security
├── review/       code-review, pr-review, animation-review
├── platform/     supabase (+ references/), supabase-branch-testing
└── meta/         improvement-protocol
```

## Usage in Cursor

- **Rules** apply automatically based on file globs or `alwaysApply: true`.
- **Skills** load on demand — attach or `@`-mention them (e.g. `@code-review`, `@supabase`).

The `.github/skills/` and `.github/instructions/` directories are retained for GitHub Copilot compatibility but are no longer the source of truth.
