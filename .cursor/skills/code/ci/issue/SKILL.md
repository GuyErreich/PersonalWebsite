---
name: ci-issue
description: GitHub issue creation workflow — pick a type template, fill required sections, assign the authenticated user, and open the issue with command gh. Use when the user asks to open or create a GitHub issue, file a bug, or write an issue body. Extends engineering.
disable-model-invocation: true
---

# CI — Issue

The milestone workflow for opening a GitHub issue.

## Extends

Load `.cursor/skills/code/foundations/engineering/SKILL.md` first.

## GitHub CLI in agent shells

Invoke the CLI as **`command gh`**, never bare `gh`. See `code/ci/pr` → `## GitHub CLI in agent shells` for why.

## Type → label

| Type | Label |
|---|---|
| bug | `bug` |
| feature | `feature` |
| chore | `maintenance` |
| docs | `documentation` |
| devops | `ci/cd` |
| security | `security` |

Infer the type from the request. Ask only if ambiguous. If the `security` label is missing, create it first:

```bash
command gh label create security --description "Security-related work" --color B60205 2>/dev/null || true
```

## Workflow

1. **Pick the type** from the table above.
2. **Load a template.** Prefer the repo `.github/ISSUE_TEMPLATE/<type>.md` when present; otherwise use this skill’s `assets/<type>.md`.
3. **Fill every required section** with complete sentences. Leave no placeholders (`<…>`, `TODO`, empty headings).
4. **Create the issue** assigned to the authenticated user:

```bash
command gh issue create \
  --title "<imperative or problem statement>" \
  --body-file <filled-template> \
  --assignee @me \
  --label <type-label>
```

5. **Return the issue URL.** `@me` is the authenticated `gh` user.

## See also

When a later PR should close this issue (Development sidebar + auto-close on merge into the default branch), follow `code/ci/pr/references/issue-linking.md`.

## Assets

| Type | Portable body |
|---|---|
| bug | `assets/bug.md` |
| feature | `assets/feature.md` |
| chore | `assets/chore.md` |
| docs | `assets/docs.md` |
| devops | `assets/devops.md` |
| security | `assets/security.md` |
