# Agentic CI Plugin

This `.cursor/` tree is structured as a portable agent plugin plus a per-project overlay. The portable core has no repository-specific paths, stack assumptions, or validate commands, so it can be copied into another repo or imported as a GitHub Remote Rule.

## Portable plugin (copy to a new repo or import as a Remote Rule)

```
.cursor/skills/code/**      # foundations, languages, web, quality, review, ci
.cursor/skills/meta/**      # skill/rule authoring + maintenance
.cursor/rules/behaviors/**  # consent + review gate (always apply)
.cursor/rules/code/**       # glob rules that load matching code skills
```

## Per-project overlay (keep in the application repo)

```
AGENT.md tree               # project context, validate commands, local conventions
.cursor/skills/project/**   # project-specific skills (UI interactions, platform/supabase)
.cursor/rules/project/**    # project guidelines + project glob rules
scripts/review-lock.py      # optional review dedup helper (advisory only)
```

## Inheritance contract

Every skill under `code/` extends `.cursor/skills/code/foundations/engineering/SKILL.md`. Downstream skills add domain rules but never weaken the universal engineering principles. Project skills may add stricter rules, never weaker ones.

## Layering

```
foundations/engineering   (universal base — always)
  └─ languages/nodejs      (TS/JS syntax + tooling)
       └─ web/libs/react   (hooks, components)
            └─ web/libs/threejs
  └─ web/ui                (layout, a11y, responsive)
  └─ quality/{performance,security}
  └─ review/{reviewer,pr-resolver}
  └─ ci/{commit,pr,push,local-review-loop}
```
