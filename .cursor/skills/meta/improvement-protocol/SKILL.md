---
name: improvement-protocol
description: Flags and implements improvements to project skills, rules, and agent instructions in parallel sessions. Use when discovering patterns that should be documented or when updating `.cursor/skills/` or `.cursor/rules/`.
disable-model-invocation: true
---

# Improvement Protocol

When a new improvement is discovered during development or review, flag it for discussion before implementation. Non-blocking improvements go in **separate parallel sessions**.

## When to Flag

- Code pattern or rule would benefit the project if documented
- Existing instruction is incomplete or outdated
- New architectural pattern should be standardized
- Skill or rule in `.cursor/skills/` or `.cursor/rules/` needs expansion

## Flag Template

```markdown
🔧 IMPROVEMENT FLAGGED:

**Category:** [Skills | Rules | Prompts | Agents]
**Target File:** [path/to/file.mdc or SKILL.md]
**Title:** [Concise name]
**Description:** [What to add/change and why]
**Scope:** [Single file | Multiple files | New file]
**Estimated Effort:** [Quick | Medium | Complex]
**Priority:** [Nice-to-have | Recommended | Critical]
```

## Process

1. **Pause** and flag explicitly with context
2. **Ask:** implement now, parallel session (recommended), or skip
3. **Parallel session:** read target file, draft, implement, validate, report back
4. Main session continues uninterrupted

## Good vs Skip

**Good:** pattern appears 2+ times, clarifies ambiguity, standardizes naming, documents edge cases

**Skip:** one-off workaround, contradicts existing style, massive refactor required, speculative features

## Target Files

- `.cursor/rules/*.mdc` — ambient rules
- `.cursor/skills/<domain>/*/SKILL.md` — deep domain workflows (`frontend/`, `quality/`, `review/`, `platform/`, `meta/`)
- `.github/workflows/` — CI only (not agent context)
