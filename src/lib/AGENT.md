# Lib Folder Agent Notes

Use this folder for shared logic, utilities, orchestration, API clients, contexts, and other non-visual reusable modules.

## Rules

- If logic is duplicated across 2 or more components or hooks, extract it here unless it is clearly feature-local.
- Keep `src/lib/` focused on reusable behavior, not view composition.
- Prefer pure functions and typed interfaces where possible.
- Keep side effects explicit and localized.
- Shared clients, contexts, orchestrators, storage helpers, and browser capability helpers belong here.

## Boundaries

- Do not put reusable hooks here unless they are tightly coupled to a lib concern and truly not UI-facing; prefer `src/hooks/` for normal hook APIs.
- Do not put feature-specific JSX or layout code here.
- If a utility becomes feature-specific instead of broadly reusable, move it closer to the feature.

## Extraction Guidance

- Repeated data transformation -> shared utility
- Repeated orchestration/state machine logic -> shared helper or orchestrator
- Repeated API/client access pattern -> shared client wrapper or helper
- Repeated browser capability detection -> shared helper
