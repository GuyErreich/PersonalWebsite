# Improvement Protocol

> **Canonical location:** [`.cursor/skills/ai-agent/improvement-protocol/SKILL.md`](../.cursor/skills/ai-agent/improvement-protocol/SKILL.md)

This document establishes a process for continuously improving skills, rules, prompts, and agent definitions.

## Overview

Whenever a new improvement is discovered during development or code review, it **must** be flagged for discussion before implementation. Improvements are implemented in **separate parallel chat sessions** to keep the main workflow uninterrupted.

## Target Files

- `.cursor/rules/**/*.mdc` — ambient Cursor rules (`behaviors/`, `code/`, `project/`, `foundations/`, `ai-agent/`)
- `.cursor/skills/**/SKILL.md` — deep domain workflows (`code/`, `project/`, `foundations/`, `ai-agent/`)
- `.github/copilot-instructions.md` — Copilot compatibility layer
- `.github/workflows/` — CI only

## When to Flag an Improvement

An improvement should be flagged when:

- A code pattern, best practice, or rule would benefit the project if documented
- An existing instruction is incomplete, outdated, or could be clarified
- A new architectural pattern or technique should be standardized across the codebase
- A lint/validation rule could be added or refined
- A skill document could be expanded with new examples or edge cases

## Flagging Process

### Step 1: Identify the Improvement

```
🔧 IMPROVEMENT FLAGGED:
File: .cursor/rules/code/languages/nodejs.mdc
Suggestion: Add explicit guideline for handling async/await in useEffect
Reason: Current code shows pattern inconsistency in AsyncWorkflow components
```

### Step 2: Wait for Approval

> Would you like me to:
> 1. **Implement this improvement now** (pauses current work)
> 2. **Create a parallel session** (recommended for non-blocking improvements)
> 3. **Skip this improvement** (defer/ignore)

### Step 3: Parallel Implementation

The parallel session reads target files, drafts, implements, validates, and reports back while the main session continues.

## See Also

- [`.cursor/skills/ai-agent/improvement-protocol/SKILL.md`](../.cursor/skills/ai-agent/improvement-protocol/SKILL.md) — full protocol
- [`.cursor/rules/project/project-guidelines.mdc`](../.cursor/rules/project/project-guidelines.mdc) — always-on project context
- [`.cursor/skills/`](../.cursor/skills/) — domain skills (`code/`, `project/`, `foundations/`, `ai-agent/`)
