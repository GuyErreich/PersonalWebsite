# Hooks Folder Agent Notes

Use this folder for reusable hooks only.

## Rules

- Organize hooks by responsibility, for example `gamedev/`, `responsive/`, `audio/`, or other clear domains.
- Do not place reusable hooks inside component folders.
- If state/effect orchestration is repeated in 2 or more components, extract it into a hook here.
- Keep hooks focused: data hooks should fetch and normalize data; responsive hooks should expose breakpoint/media state; interaction hooks should encapsulate shared behavior.
- Prefer returning typed data structures rather than leaking raw implementation details into UI components.

## Skill Usage

- Use `ui-architecture` when deciding whether repeated component logic should become a hook.
- Use `code-quality` for dependency-array correctness, type cleanup, async patterns, and general hook safety.
