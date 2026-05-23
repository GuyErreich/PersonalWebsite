# Improvement Protocol

This document establishes a process for continuously improving skills, instructions, prompts, AGENT.md files, and agent definitions.

## Overview

Whenever a new improvement is discovered during development or code review, it **must** be flagged for discussion before implementation. Improvements are implemented in **separate parallel chat sessions** to keep the main workflow uninterrupted.

## When to Flag an Improvement

An improvement should be flagged when:

- A code pattern, best practice, or rule would benefit the project if documented
- An existing instruction is incomplete, outdated, or could be clarified
- A new architectural pattern or technique should be standardized across the codebase
- A lint/validation rule could be added or refined
- A skill document (in `.github/skills/`) could be expanded with new examples or edge cases
- Agent instructions (in `.github/agents/`) could be enhanced to handle new scenarios
- The main `copilot-instructions.md` or any prompt file needs refinement

## Flagging Process

### Step 1: Identify the Improvement
When an improvement is discovered, I will:
- **Pause the current task** and flag it explicitly
- **Describe the improvement** with context (what, where, why)
- **Specify the target file(s)** (e.g., `copilot-instructions.md`, `.github/skills/code-quality/SKILL.md`)

Example:
```
🔧 IMPROVEMENT FLAGGED:
File: .github/copilot-instructions.md (Conventions section)
Suggestion: Add explicit guideline for handling async/await in useEffect
Reason: Current code shows pattern inconsistency in AsyncWorkflow components
```

### Step 2: Wait for Approval
After flagging, I will **ask you directly**:

> Would you like me to:
> 1. **Implement this improvement now** (pauses current work)
> 2. **Create a parallel session** (recommended for non-blocking improvements)
> 3. **Skip this improvement** (defer/ignore)

### Step 3: Parallel Implementation
If you approve a parallel session:

- I will **create a new chat session** with context about the improvement
- That session will:
  - Read and understand the target file(s)
  - Draft the improvement
  - Implement the change
  - Validate the update (e.g., no lint errors, clarity check)
  - Notify you when complete
- Your **current session continues uninterrupted**
- Both sessions report back when done

## Improvement Template

When flagging, use this structure:

```markdown
🔧 IMPROVEMENT FLAGGED:

**Category:** [Skills | Instructions | Prompts | AGENT.md | Agents]
**Target File:** [path/to/file.md]
**Title:** [Concise improvement name]
**Description:** [What should be added/changed and why]
**Scope:** [Single file | Multiple files | New file]
**Estimated Effort:** [Quick <5min | Medium 5-15min | Complex >15min]
**Priority:** [Nice-to-have | Recommended | Critical]

**Example/Context:**
[Code snippet, scenario, or reference that prompted this improvement]
```

## Guidelines for Improvements

✅ **Good improvements:**
- Address a pattern that appears 2+ times in code
- Clarify ambiguous or incomplete instructions
- Standardize naming or architectural patterns
- Add defensive rules (e.g., new lint checks)
- Document edge cases or gotchas

❌ **Skip:**
- One-off workarounds for a single file
- Improvements that contradict existing style
- Changes that require massive refactoring elsewhere
- Speculative features with no current use

## Session Coordination

### Current (Main) Session
Continues the original task without interruption. May pause briefly to approve improvements, then resumes.

### Improvement Session (Parallel)
- Has full context: original instruction files, current codebase state, relevant examples
- Works autonomously: reads, edits, validates, and reports completion
- Does **not** block the main workflow
- Reports back with: files changed, summary of improvement, and any follow-up notes

### Completion Handoff
When an improvement session finishes:
- Main session is notified
- Files are already merged (not staged for you to approve)
- You can review changes anytime or request adjustments in a follow-up session

## Example Workflow

**Main Session (Feature Development):**
```
Working on: UserAuthForm component
Found: useEffect async/await pattern inconsistency
→ Flag improvement for copilot-instructions.md
→ Ask: "Implement now or parallel session?"
→ If parallel: Continue working on UserAuthForm while improvement happens
→ Notification when ready: "✅ Instructions updated in parallel session"
→ Resume main task without delay
```

**Improvement Session:**
```
Goal: Add async/await convention to copilot-instructions.md
1. Read current instructions
2. Research usage in codebase
3. Draft enhanced section
4. Implement change
5. Validate (run lint, clarity check)
6. Report: "✅ Done. Added async/await + try/catch pattern to Conventions."
```

## Maintenance

This protocol should be reviewed and updated when:
- New skill files are created (add to target files list)
- Agent definitions change (update scope)
- Project structure changes significantly (update paths)

---

**See Also:**
- [copilot-instructions.md](./copilot-instructions.md) — Main guidelines
- [.github/skills/](./skills/) — Skill documents (code quality, UI architecture, etc.)
- [.github/agents/](./agents/) — Agent-specific instructions
