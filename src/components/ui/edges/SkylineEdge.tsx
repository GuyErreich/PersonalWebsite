/**
 * SkylineEdge — GameDev → DevOps transition.
 *
 * WebGL canvas strip with a GLSL fragment shader:
 *  - highp precision + fwidth anti-aliasing on all boundaries (no hard branches)
 *  - Procedural building silhouettes, per-window flicker, rain streaks
 *  - Cyan roofline glow + violet halo above the skyline
 *  - Solid fill at the very bottom matching the next section's background colour
 *
 * ResizeObserver watches the wrapper div for correct DPR-aware sizing.
 */

import { useEffect, useRef } from 'react';

interface SkylineEdgeProps {
  fillColor: string;
  className?: string;
}

const VERT = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform float uTime;
  uniform vec3  uFill;
  uniform vec2  uRes;

  float hash(float n)  { return fract(sin(n) * 43758.5453); }
  float hash2(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Roof height at uv.x — pseudo-random variable-width building columns
  float roofAt(float x) {
    float col = 0.0;
    float xAcc = 0.0;
    for (int i = 0; i < 40; i++) {
      float w = 0.04 + hash(float(i) * 3.71) * 0.08;
      if (xAcc + w > x) { col = float(i); break; }
      xAcc += w;
    }
    float centre = 1.0 - 2.0 * abs(x - 0.5);
    return 0.30 + hash(col * 7.13) * 0.45 * (0.5 + centre * 0.5);
  }

  // Per-window random flicker (each window has its own period)
  float windowLit(float wx, float wy) {
    float seed   = hash2(vec2(floor(wx), floor(wy)));
    float period = 2.0 + seed * 6.0;
    return step(0.38, fract(seed + uTime / period));
  }

  // 3-layer rain streaks
  float rain(vec2 uv) {
    float r = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi      = float(i);
      float speed   = 0.6 + fi * 0.3;
      float density = 60.0 + fi * 25.0;
      vec2  st      = vec2(uv.x * density + fi * 37.3, uv.y + uTime * speed);
      float c       = fract(hash(floor(st.x)) + st.y);
      float streak  = smoothstep(0.94, 1.0, c) * smoothstep(1.0, 0.94, c + 0.04);
      r += streak * (0.15 - fi * 0.04);
    }
    return r;
  }

  void main() {
    vec2  uv   = gl_FragCoord.xy / uRes;
    float y    = uv.y;
    float roof = roofAt(uv.x);

    // Anti-aliased boundary between sky and building top — fixed 1.5px, not fwidth
    float dRoof   = y - roof;
    float aaH     = 1.5 / uRes.y;
    float aboveT  = smoothstep(-aaH, aaH, dRoof);   // 0=building, 1=sky

    // Anti-aliased boundary between building and solid fill at bottom
    float fillLine  = 0.18;
    float dFill     = y - fillLine;
    float fwf       = 1.5 / uRes.y;
    float aboveFill = smoothstep(-fwf, fwf, dFill); // 0=fill, 1=building

    // ── Solid fill colour (bottom strip) ────────────────────────────────
    vec4 fillRgba = vec4(uFill, 1.0);

    // ── Building interior ────────────────────────────────────────────────
    vec3  facade  = vec3(0.02, 0.035, 0.055);
    float wCols   = 50.0, wRows = 35.0;
    float wx      = uv.x * wCols;
    float wy      = y    * wRows;
    vec2  wCell   = fract(vec2(wx, wy));
    bool  inWin   = wCell.x > 0.12 && wCell.x < 0.88 &&
                    wCell.y > 0.10 && wCell.y < 0.90;
    float lit     = inWin ? windowLit(wx, wy) : 0.0;
    vec3  cyanL   = vec3(0.55, 0.95, 1.0);
    vec3  amber   = vec3(1.0,  0.75, 0.35);
    float wSeed   = hash2(vec2(floor(wx), floor(wy)));
    vec3  winCol  = mix(cyanL, amber, step(0.6, wSeed));
    float fadeUp  = smoothstep(fillLine, fillLine + 0.08, y);
    vec3  build   = facade + lit * winCol * 0.55 * fadeUp;
    build        += rain(uv) * vec3(0.4, 0.7, 1.0) * 0.6;
    vec4  buildRgba = vec4(build, 1.0);

    // Sky glow — expressed in pixel units so it's uniformly ~4px wide at any DPR
    float above    = max(dRoof, 0.0);
    float abovePx  = above * uRes.y;
    float edgeGlow = exp(-abovePx * 0.55) * 1.6;
    float halo     = exp(-abovePx * 0.18) * 0.4;
    float pulse    = 0.8 + 0.2 * sin(uTime * 1.8 + uv.x * 5.2);
    vec3  glowCol  = vec3(0.024, 0.714, 0.831);
    vec3  haloCol  = vec3(0.545, 0.361, 0.965);
    float skyAlpha = (edgeGlow + halo * 0.6) * pulse;
    vec3  skyCol   = (edgeGlow * glowCol + halo * haloCol) / max(edgeGlow + halo * 0.6, 0.001);
    vec4  skyRgba  = vec4(skyCol * skyAlpha, skyAlpha * 0.85);

    // Composite: fill → building → sky (all anti-aliased, no hard branches)
    vec4 ground = mix(fillRgba, buildRgba, aboveFill);
    vec4 result = mix(ground, skyRgba, aboveT);

    // ── Bottom seal: gradient over the bottom 50% of the strip → clean seam ─
    float seal = smoothstep(0.0, 0.50, uv.y);
    gl_FragColor = mix(fillRgba, result, seal);
  }
`;

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255];
}

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  return prog;
}

export const SkylineEdge = ({ fillColor, className = '' }: SkylineEdgeProps) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const prog = createProgram(gl);
    gl.useProgram(prog);

    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf   = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uFill = gl.getUniformLocation(prog, 'uFill');
    const uRes  = gl.getUniformLocation(prog, 'uRes');
    const [r, g, b] = hexToVec3(fillColor);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w   = wrapper.offsetWidth;
      const h   = wrapper.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const start = performance.now();
    const loop = () => {
      const elapsed = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform3f(uFill, r, g, b);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [fillColor]);

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-x-0 bottom-0 pointer-events-none ${className}`}
      style={{ height: 140 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
