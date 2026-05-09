---
description: "Use when: optimizing components, reducing memory usage, preventing memory leaks, profiling performance, or ensuring zero-leak audio/WebGL/Three.js resource cleanup. Triggers on useEffect cleanup, canvas, AudioContext, event listeners, ref management, bundle size, render optimization."
applyTo: "**"
---

# Performance & Memory Management Instructions

Apply these rules whenever you create or edit components that use Three.js, AudioContext, event listeners, animations, or any resource that requires cleanup:

## 1. Memory Leak Prevention
- Always free resources in a `useEffect` cleanup function (Three.js geometries/materials, AudioContext, event listeners, timers, animations).
- For AudioContext, always call `audioCtx.close()` in cleanup and use `void promise.catch(() => {})` for intentional suppression.
- For Three.js, always call `.dispose()` on every geometry and material you create.

## 2. Render Optimization
- Avoid allocations inside render loops (e.g., `useFrame`).
- Prefer `InstancedMesh` for many identical geometries.
- Use direct ref mutation for per-frame values instead of React state.

Follow these rules to ensure zero memory leaks and optimal performance.