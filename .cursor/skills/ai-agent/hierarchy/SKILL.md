---
name: agent-hierarchy
description: Agent-library hierarchy — when to add a rule, SKILL.md, or flat references file; prefer deepening over widening. Use when creating or reorganizing skills, rules, or AGENT.md under .cursor/ or the agent stack. Extends foundations/hierarchy.
disable-model-invocation: true
---

# Agent Hierarchy

How to organize an **agent library** (skills, rules, `AGENT.md`). In a source tree the main aggregation lever is a parent folder. In an agent library aggregation is usually a `references/` file: context budget punishes eager loading, and every new skill folder adds a discovery surface.

**Prefer deepening an existing skill over widening the tree.** Keep `references/` **flat** (one level only) — no subfolders under `references/`.

## Extends

Load `.cursor/skills/foundations/hierarchy/SKILL.md` first. Nesting and retrieval tests apply; this skill adds **container tiers** and agent-specific aggregation.

## Container tiers (context cost, low → high)

| Tier | When | Cost |
|---|---|---|
| `rules/*.mdc` `alwaysApply: true` | Tiny triggers and pointers needed on nearly every request | Highest — every turn |
| `rules/*.mdc` with `globs` | Domain entry when matching files are open | High when open |
| `SKILL.md` | One coherent workflow or domain; keep well under 500 lines | Medium — on attach / load |
| `references/<topic>.md` | Depth most tasks do not need; files live directly under `references/` | Low — load on demand |
| `assets/` | Copyable templates | On copy only |
| `AGENT.md` chain | Project-local context by path proximity | When working in that folder |

Distinguish axes with **file-name prefixes** (for example `desktop-navigation-motion.md`, `mobile-pickers.md`), not with nested folders. If an axis needs its own trigger and workflow, promote it to a **sibling skill**.

## Aggregation decision

Run **before** choosing any new folder:

1. Does an existing skill already own this responsibility? → Add a flat `references/<topic>.md`; do **not** create a sibling skill.
2. Needed on nearly every task and expressible in one to three lines? → Make it a rule (prefer glob over always-on).
3. Has its own trigger and workflow, and loading it would drag in unrelated context? → New skill.
4. Multiple references share an axis? → Prefix the filenames in the same flat `references/` folder — never add `references/<group>/`.

Then apply the nesting and retrieval tests from `foundations/hierarchy` to the chosen path.

## Agent drift signals

Load `references/worked-examples.md` for illustrations. Restructure when:

| Signal | Action |
|---|---|
| `SKILL.md` past ~500 lines | Split into flat `references/`, not sibling skills |
| Nested folders under `references/` | Flatten; use filename prefixes or promote to a sibling skill |
| References always loaded together | Merge them |
| A reference never loaded | Summary sufficed — fold or delete |
| Two skills with identical `Extends` always loaded together | Merge |
| Short skill, no references, shares axis with siblings | Candidate to become a `references/` file of a parent skill |
| Always-applied rule past ~10 lines | Move body to a skill; keep a pointer rule |

## When to load references

| Topic | Reference |
|---|---|
| Agent taxonomy worked examples | `references/worked-examples.md` |
