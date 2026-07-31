---
name: improvement-protocol
description: Flags and implements improvements to skills, rules, and agent instructions. Use when discovering patterns that should be documented, after UI/motion/shell work, or when updating `.cursor/skills/` or `.cursor/rules/`.
disable-model-invocation: true
---

# Improvement Protocol

When a new improvement is discovered during development or review, **flag it before implementing doc changes**. Non-blocking doc work goes in **separate parallel sessions**.

**Canonical location:** `~/.cursor/skills/meta/improvement-protocol/SKILL.md` — do not duplicate per project.

## When to flag

- Code pattern or rule would benefit if documented
- Existing instruction is incomplete or outdated
- New architectural or UI pattern should be standardized
- Skill or rule needs expansion
- Fix addresses a **class of defect** (clip boundary, dismiss lifecycle, RLS pattern) — even on first occurrence

## Mandatory post-task flag block

After completing work on **UI, motion, shell layout, styles tokens, skills, or rules**, end the task with:

```markdown
## Improvement flags
- [none]
```

or one or more flags using the template below.

**Flagging is automatic.** **Implementing** doc/skill changes still requires user approval (parallel session recommended) unless the user explicitly asked to update skills in the same task.

## Flag template

```markdown
🔧 IMPROVEMENT FLAGGED:

**Category:** [Skills | Rules | Agents]
**Target File:** [path/to/file.mdc or SKILL.md]
**Title:** [Concise name]
**Description:** [What to add/change and why]
**Scope:** [Single file | Multiple files | New file]
**Portable or project:** [portable `~/.cursor/skills/foundations/**` or `~/.cursor/skills/code/**` | project `.cursor/skills/project/**` | system `~/.cursor/rules/**`]
**Estimated Effort:** [Quick | Medium | Complex]
**Priority:** [Nice-to-have | Recommended | Critical]
```

## Process

1. **Flag** explicitly with context (mandatory block above)
2. **Ask:** implement now, parallel session (recommended), or skip
3. **Parallel session:** read target file, draft, implement, validate, report back
4. Main session continues uninterrupted

## Good vs skip

**Good:**

- Pattern appears 2+ times
- Clarifies ambiguity or standardizes naming
- **Class-of-bug** — reusable category (overflow clip vs padding, overlay dismiss lifecycle, boundary validation)
- Documents edge cases agents will hit again

**Skip:**

- One-off typo or single-instance data bug
- Contradicts existing style
- Massive refactor required
- Speculative features

## Target files

| Layer | Path |
|---|---|
| System behaviors | `~/.cursor/rules/behaviors/*.mdc` |
| Portable foundations rules | `~/.cursor/rules/foundations/**/*.mdc` |
| Portable foundations skills | `~/.cursor/skills/foundations/**/SKILL.md` |
| Portable code rules | `~/.cursor/rules/code/**/*.mdc` |
| Portable skills | `~/.cursor/skills/code/**/SKILL.md` |
| Project skills | `<repo>/.cursor/skills/project/**/SKILL.md` |
| Project rules | `<repo>/.cursor/rules/project/*.mdc` |
| Agent entry | `<repo>/AGENTS.md`, `AGENT.md` chain |
| CI only | `.github/workflows/` (not agent context) |

Keep portable `foundations/**`, `code/**`, and `meta/**` skills free of project paths and commands. Project-specific guidance belongs in `project/**` or the repo `AGENT.md` chain.

## Portable vs project (quick rule)

| If the lesson is… | Put it in… |
|---|---|
| Generic web UX / layout pattern | `~/.cursor/skills/code/web/ux/references/` |
| App shell tokens, component names, tab mapping | Repo `AGENT.md` or future project skill |
| Supabase / Postgres | Repo `project/platform/supabase` |
