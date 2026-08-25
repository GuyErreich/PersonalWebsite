# Agentic CI Plugin

This `.cursor/` tree is structured as a portable agent plugin plus a per-project overlay. The portable core has no repository-specific paths, stack assumptions, or validate commands, so it can be copied into another repo or imported as a GitHub Remote Rule.

## Portable plugin (copy to a new repo or import as a Remote Rule)

```
.cursor/skills/foundations/**  # domain-agnostic hierarchy (and future universal bases)
.cursor/skills/code/**         # foundations, languages, web, quality, review, ci
.cursor/skills/ai-agent/**     # agent taxonomy + skill/rule maintenance
.cursor/rules/foundations/**   # always-on hierarchy rule
.cursor/rules/ai-agent/**      # glob rules for agent-library hierarchy
.cursor/rules/behaviors/**     # consent + review gate (always apply)
.cursor/rules/code/**          # glob rules that load matching code skills
.cursor/agents/**              # project subagents (pr-reviewer, pr-fixer)
.cursor/hooks.json             # project hooks entrypoint
.cursor/hooks/**               # review-loop budget / round / git-guard hooks
```

## Per-project overlay (keep in the application repo)

```
AGENT.md tree               # project context, validate commands, local conventions
.cursor/skills/project/**   # project-specific skills (platform/supabase, deploy-secrets)
.cursor/rules/project/**    # project guidelines + project glob rules
scripts/review-lock.py      # optional review dedup helper (advisory only)
```

## Portable vs project rules

| Layer | Location | Examples |
|---|---|---|
| Portable | `~/.cursor/rules/code/web/` (or copied `.cursor/rules/code/web/`) | `ui.mdc`, `ux.mdc`, `components-ui-hierarchy.mdc`, `mobile-ui.mdc`, `mobile-ux.mdc`, `desktop-ui.mdc`, `desktop-ux.mdc` |
| Project | `.cursor/rules/project/` | `project-guidelines.mdc` — repo paths and product contracts |

Portable rules anchor on `**/components/ui/**` (no `src/` prefix). Project rules add shell paths and product-specific globs. Greenfield UI hierarchy: `code/web/ui` → `components-ui-hierarchy.md`.

## Inheritance contract

Every skill under `code/` extends `.cursor/skills/code/foundations/engineering/SKILL.md`. Domain-agnostic folder taxonomy lives in `.cursor/skills/foundations/hierarchy/` (outside `code/`). Agent-library container tiers live in `.cursor/skills/ai-agent/hierarchy/` (extends foundations). Downstream skills add domain rules but never weaken the universal engineering principles. Project skills may add stricter rules, never weaker ones.

## Layering

```
foundations/hierarchy     (domain-agnostic folder taxonomy — always)
ai-agent/hierarchy        (agent container tiers — deepen vs widen)
ai-agent/improvement-protocol
code/foundations/engineering   (code base — always)
  └─ languages/nodejs      (TS/JS syntax + npm tooling)
       └─ web/libs/react   (hooks, components)
            └─ web/libs/threejs
  └─ web/ui                (layout, a11y, responsive)
  └─ web/ux                (motion, press, overlays, sound)
  └─ quality/{performance,security}
  └─ review/{reviewer,pr-resolver}
  └─ ci/{worktree,commit,pr,push,local-review-loop,pr-review-loop}
```
