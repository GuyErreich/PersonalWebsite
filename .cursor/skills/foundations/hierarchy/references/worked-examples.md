# Worked Examples

Illustrations only — **no moves are applied by this document**. Use them to practice the two tests and the restructure operations.

## 1. Quality vs language — split generic / specific

**Candidates:** `code/quality/performance`, `code/quality/security`, and whether they belong under `code/languages/nodejs`.

| Material | Nesting test for `languages/nodejs` | Placement |
|---|---|---|
| Resource cleanup, render discipline, no allocation in hot loops | Fails — holds for any runtime | Stay under `quality/performance` |
| Injection, XSS, CSRF, server validation, secret handling | Fails — holds beyond Node | Stay under `quality/security` |
| Node/Vite public-env prefix rules, npm-specific tooling | Passes — meaningless outside Node | Nest under `languages/nodejs` (or a `references/` file there) |

**Rule applied:** generic stays high; only runtime-bound specifics nest. Do not move the whole quality skill under Node because part of it is Node-flavored.

## 2. CI / review — latent `git` grouping

**Candidates:** `code/ci/{commit,pr,push,local-review-loop}`, `code/review/*`, and behavior rules named `git-commit-consent`, `git-push-consent`.

- Repeated prefix `git-*` on consent rules is a **drift signal**: names simulating a missing folder.
- `commit` / `push` are VCS milestones; `pr` / `reviewer` / `pr-resolver` are review milestones. They share a lifecycle axis under `ci` / `review` today, which is still coherent.
- If git-specific mechanics grow (hooks, rebase policy, worktrees), introduce `ci/git/` (or `behaviors/git/`) when **3+** items share that context — do not nest early for a single file.

**Rule applied:** earn the level; use rename/nest only when the prefix pattern becomes a real sibling set.

## 3. `meta` → subject-named folder — rename for drift

**Candidate:** `.cursor/skills/meta/improvement-protocol`.

- `meta` names the abstraction level ("about the system"), not the subject a newcomer searches for.
- Retrieval test: someone looking for "make the agent / skills / rules better" will look for `ai-agent`, `agent`, or `skills` — not `meta`.
- Rename-for-drift operation: rename the parent to the subject (for example `ai-agent`) when approved; update every index in the same change.

**Rule applied:** prefer subject names over meta-labels when the folder's job is discoverable maintenance of the agent stack.

## 4. Source UI tree — context under a feature

**Candidate:** `src/components/ui/` with feature folders such as `gamedev/` / `devops/`.

| Item | Nesting test | Placement |
|---|---|---|
| Cross-feature primitives (buttons, shells used everywhere) | Fails for any single feature | Stay at `ui/` root |
| Feature-only reusable blocks | Passes for that feature | `ui/<feature>/common/` |
| Desktop / mobile layout variants of one feature | Passes — meaningless outside the feature | `ui/<feature>/desktop/`, `ui/<feature>/mobile/` |

**Rule applied:** nest to maintain logical context under the feature; keep shared primitives high so retrieval for "the button" does not require knowing a feature name.
