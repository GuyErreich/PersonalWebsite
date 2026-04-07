/**
 * Shared WebGL helpers used by edge-transition canvas components.
 *
 * Centralises the three functions that were copy-pasted across every
 * WebGL edge file (hexToVec3, shader compilation, program linking).
 * Each helper is stateless and side-effect-free except for the intentional
 * gl.useProgram call inside buildGlProgram.
 */

/** Convert a CSS hex colour string to a normalised [r, g, b] triple. */
export function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
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
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(`[${label}] GLSL compile error:`, gl.getShaderInfoLog(s));
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
  const prog = gl.createProgram()!;
  gl.attachShader(prog, buildGlShader(gl, gl.VERTEX_SHADER, vert, label));
  gl.attachShader(prog, buildGlShader(gl, gl.FRAGMENT_SHADER, frag, label));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(`[${label}] GLSL link error:`, gl.getProgramInfoLog(prog));
  }
  // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API, not a React hook
  gl.useProgram(prog);
  return prog;
}
