---
description: "Use when: fixing lint errors, TypeScript type issues, removing any types, removing ts-nocheck, fixing unused variables, fixing empty catch blocks, or validating code quality before committing."
applyTo: "**"
---

# Code Quality Instructions

Apply these rules whenever validating, fixing, or writing code:

## 1. TypeScript
- Never use `any`. Always use specific types or create a named interface/type alias.
- For refs, always provide the exact element/object type.
- For browser-vendor API extensions, extend the `Window` interface inline.
- For component prop shapes, always define an interface.
- For Three.js material access, always cast to the concrete material type.

## 2. Linting & Build
- Code must pass `npm run lint` and `npm run build` with zero errors before committing.
- Remove unused variables or prefix with `_` if intentional.
- Never use `@ts-nocheck`.
- Never use bare `catch (e) {}`; use `catch {}` for intentional suppression or log and re-throw.
- Never use `console.log/debug/info`; only `console.error`/`console.warn` for unrecoverable browser-API failures.
- Always include every referenced variable in hook dependency arrays.
- Use async/await only; never `.then()/.catch()` chains.

Follow these rules to maintain strict code quality and consistency.