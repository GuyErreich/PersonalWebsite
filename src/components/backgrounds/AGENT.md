# Backgrounds Folder Agent Notes

Use this folder for reusable visual background systems, including Three.js and particle-based scene layers.

## Rules

- Search this folder before creating a new background effect or scene wrapper.
- Reuse existing scene parts, particle systems, and background wrappers before creating new ones.
- Keep backgrounds decorative and isolated from content/layout responsibilities.
- Shared visual systems belong in reusable subfolders; feature-specific composition should stay thin.

## Performance

- Avoid per-frame allocations in animation loops.
- Do not instantiate continuous objects in `useFrame`.
- Reuse materials, geometries, vectors, and config objects when possible.
- Prefer lightweight composition over stacking multiple expensive effects when one can be extended.

## Structure

- Shared background families should live in clear subfolders such as `three/` or `tsparticles/`.
- Put reusable low-level scene parts near their family.
- Keep top-level background entry components focused on composition.

## Coordination

- Follow existing Three.js and performance instructions when editing `three/` components.
- If audio, orchestration, or browser capability logic repeats, extract it into hooks or `src/lib/` rather than duplicating it inside scene components.
