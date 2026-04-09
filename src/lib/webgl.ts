/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Shared WebGL helpers used by edge-transition canvas components.
 *
 * Centralises the three functions that were copy-pasted across every
 * WebGL edge file (hexToVec3, shader compilation, program linking).
 * Each helper is stateless and side-effect-free except for the intentional
 * gl.useProgram call inside buildGlProgram.
 */

/** Convert a CSS hex colour string to a normalised [r, g, b] triple.
 * Accepts both 3-digit shorthand (#rgb) and 6-digit (#rrggbb) formats.
 * Throws a descriptive error for any other input so callers learn about
 * misconfigured colour constants at development time rather than silently
 * rendering NaN uniforms.
 */
export function hexToVec3(hex: string): [number, number, number] {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (raw.length === 3) {
    // Expand shorthand #rgb → #rrggbb
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      throw new Error(`hexToVec3: invalid 3-digit hex colour "${hex}"`);
    }
    return [r / 255, g / 255, b / 255];
  }
  if (raw.length !== 6) {
    throw new Error(`hexToVec3: expected a 3- or 6-digit hex colour, got "${hex}"`);
  }
  const n = parseInt(raw, 16);
  if (Number.isNaN(n)) {
    throw new Error(`hexToVec3: invalid hex colour "${hex}"`);
  }
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

/**
 * Compile a single GLSL shader stage.
 * Logs a console.error on compile failure (GLSL errors are unrecoverable).
 */
export function buildGlShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
  label: string,
): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error(`[${label}] Failed to create shader (context lost or OOM)`);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(s) ?? "unknown error";
    gl.deleteShader(s);
    console.error(`[${label}] GLSL compile error:`, info);
    throw new Error(`[${label}] GLSL compile error: ${info}`);
  }
  return s;
}

/**
 * Link a WebGL program from GLSL source strings and activate it immediately.
 * Logs a console.error on link failure (unrecoverable — no fallback exists).
 *
 * gl.useProgram is a WebGL API method — the `use` prefix is a naming collision
 * with React hook conventions. The biome-ignore below is intentional and correct.
 */
export function buildGlProgram(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string,
  label: string,
): WebGLProgram {
  const prog = gl.createProgram();
  if (!prog) throw new Error(`[${label}] Failed to create WebGL program (context lost or OOM)`);
  const vs = buildGlShader(gl, gl.VERTEX_SHADER, vert, label);
  const fs = buildGlShader(gl, gl.FRAGMENT_SHADER, frag, label);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) ?? "unknown error";
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    console.error(`[${label}] GLSL link error:`, info);
    throw new Error(`[${label}] GLSL link error: ${info}`);
  }
  // Detach and delete shaders after a successful link — they are no longer needed
  // and retaining them wastes GPU memory (especially on rebuild/HMR).
  gl.detachShader(prog, vs);
  gl.detachShader(prog, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API, not a React hook
  gl.useProgram(prog);
  return prog;
}
