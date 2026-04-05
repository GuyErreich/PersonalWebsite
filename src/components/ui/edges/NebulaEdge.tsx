/**
 * NebulaEdge — Hero → GameDev transition.
 *
 * WebGL canvas strip with a GLSL fragment shader:
 *  - highp precision to avoid banding on Retina displays
 *  - fwidth()-based anti-aliased horizon edge (no hard pixel steps)
 *  - 4-octave FBM noise drives a flowing alien nebula silhouette
 *  - Emerald → cyan → violet glow above the horizon
 *  - Solid fill below matching the next section's background colour
 *
 * ResizeObserver watches the wrapper div (not the canvas) so the buffer
 * is correctly sized even before the first paint.
 */

import { useEffect, useRef } from 'react';

interface NebulaEdgeProps {
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

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float gradNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
          dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; i++) {
      v += a * gradNoise(p);
      p  = rot * p * 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2  uv = gl_FragCoord.xy / uRes;
    float t  = uTime * 0.75;

    // ── Shared cloud noise (sampled once, reused across all layers) ──────
    // cA: slow-moving cloud density / shadow pockets
    float cA = fbm(vec2(uv.x * 2.0 - t * 0.18, uv.y * 1.4 + t * 0.10));
    // cB: secondary highlight / density variation
    float cB = fbm(vec2(uv.x * 1.5 + t * 0.12, uv.y * 1.9 - t * 0.07));
    // cx: lateral colour drift used for hue mixing
    float cx  = fbm(vec2(uv.x * 1.3 + t * 0.28, t * 0.14));

    // ── Layer 0: Deep background nebula ───────────────────────────────────
    // Slowest, lowest, widest glow — distant nebula atmospheric haze.
    // Uses gradNoise (not fbm) to keep it cheap; it only needs low frequency.
    float h0 = 0.35
      + 0.025 * sin(uv.x * 1.43 + t * 0.62)
      + 0.018 * sin(uv.x * 2.71 - t * 0.83)
      + 0.018 * gradNoise(vec2(uv.x * 1.1 + t * 0.28, t * 0.21));
    float d0  = uv.y - h0;
    // Cubic falloff → very wide, soft atmospheric dome
    float b0  = pow(clamp(1.0 - d0 / 0.55, 0.0, 1.0), 3.0);
    // Deep indigo-purple; cB drives density so it clumps into cloud volumes
    vec3  col0 = vec3(0.08, 0.02, 0.30) * b0 * (0.42 + 0.58 * (cB * 0.5 + 0.5));
    float a0   = b0 * 0.38;
    // Faint emission ridge at its own horizon
    float e0   = exp(-abs(d0) * uRes.y * 1.5) * 0.40;
    col0 += vec3(0.32, 0.07, 0.72) * e0;
    a0   += e0 * 0.25;

    // ── Layer 1: Mid-ground horizon ───────────────────────────────────────
    // Medium speed; violet/amethyst palette; cA shadow pockets carve depth.
    // Slope budget: 0.038×1.97 + 0.030×3.41 + 0.020×5.83 = 0.295 < 0.5 ✓
    float h1 = 0.44
      + 0.038 * sin(uv.x * 1.97 + t * 1.05)
      + 0.030 * sin(uv.x * 3.41 - t * 1.62)
      + 0.020 * sin(uv.x * 5.83 + t * 0.97)
      + 0.030 * fbm(vec2(uv.x * 1.2 - t * 0.55, t * 0.33));
    float d1   = uv.y - h1;
    float b1   = pow(clamp(1.0 - d1 / 0.26, 0.0, 1.0), 1.8);
    // Shadow pockets: cA modulates density so cloud volumes emerge
    float den1 = b1 * (0.50 + 0.50 * (cA * 0.5 + 0.5));
    vec3  col1 = mix(vec3(0.28, 0.06, 0.60), vec3(0.54, 0.36, 0.97), b1) * den1;
    // Apply shadow darkening a second time for richer contrast
    col1      *= (0.60 + 0.40 * (cA * 0.5 + 0.5));
    float a1   = den1 * 0.50;
    // Sharper emission ridge on this layer
    float e1   = exp(-abs(d1) * uRes.y * 1.1) * 0.80;
    col1 += vec3(0.54, 0.36, 0.97) * 0.70 * e1;
    a1   += e1 * 0.28;

    // ── Layer 2: Main (front) horizon — existing shape, enhanced ─────────
    // All original incommensurate sine terms preserved; total slope ≈ 0.696 ✓
    float h2 = 0.50
      + 0.050 * sin(uv.x * 2.31 + t * 1.70)
      + 0.042 * sin(uv.x * 3.73 - t * 2.41)
      + 0.030 * sin(uv.x * 5.17 + t * 1.53)
      + 0.020 * sin(uv.x * 7.11 - t * 3.10)
      + 0.014 * sin(uv.x * 8.97 + t * 2.07)
      + 0.045 * fbm(vec2(uv.x * 1.6 + t * 0.70, t * 0.48));
    float d2  = uv.y - h2;

    // Fixed 1.5-pixel AA on main fill edge — NOT fwidth() (avoids segmented glow)
    float aaH  = 1.5 / uRes.y;
    float fill  = smoothstep(-aaH, aaH, d2);

    float b2   = clamp(1.0 - d2 / 0.20, 0.0, 1.0);
    // cA carves shadow pockets into the main band
    float den2 = b2 * (0.60 + 0.40 * (cA * 0.45 + 0.55));
    vec3  col2 = mix(
      vec3(0.063, 0.725, 0.506),
      mix(vec3(0.024, 0.714, 0.831), vec3(0.54, 0.36, 0.97), cx + 0.4),
      b2 * 0.7 + 0.2
    );
    // cB darkens some areas → shadow depth within the main band
    col2 *= (0.68 + 0.32 * (cB * 0.5 + 0.5));

    // Specular hotspot: where cA and cx both peak → bright star-forming nucleus
    float hot = clamp((cA + 0.3) * (cx + 0.3) * 3.0, 0.0, 1.0) * b2;
    col2 += vec3(0.024, 0.714, 0.831) * hot * 0.55;

    // Pixel-space emission line — same fixed half-life regardless of DPR / aspect
    float e2  = exp(-abs(d2) * uRes.y * 0.7) * 1.8;
    col2 += e2 * mix(vec3(0.024, 0.714, 0.831), vec3(1.0), 0.4);

    float pulse = 0.85 + 0.15 * sin(uTime * 1.2 + uv.x * 2.8);
    float a2 = den2 * den2 * pulse * 0.72 + e2 * 0.60;

    // ── Sub-horizon scatter: warm emerald tint just below the ridge ─────────
    // scatterFade kills the tint before it reaches the bottom edge so the seam
    // with the next section stays clean. Fade out below 22% strip height.
    float scatterFade = smoothstep(0.0, 0.22, uv.y);
    float below   = clamp(-d2 / 0.06, 0.0, 1.0) * scatterFade;
    vec3  subFill = uFill + vec3(0.063, 0.725, 0.506) * 0.28 * below * below;

    // ── Composite — additive emission layers, gated by main horizon fill ──
    // All layers are physical light emitters → additive summation is correct.
    vec3  glow = col0 * a0 + col1 * a1 + col2 * a2;
    float gA   = clamp(a0 * 0.55 + a1 * 0.65 + a2, 0.0, 1.0);

    vec4 result = mix(
      vec4(subFill, 1.0),   // solid fill zone (below main horizon)
      vec4(glow, gA),        // layered glow zone (above main horizon, hero shows through)
      fill
    );

    // ── Bottom seal: gradient over the bottom 50% of the strip → clean seam ─
    float seal = smoothstep(0.0, 0.50, uv.y);
    gl_FragColor = mix(vec4(uFill, 1.0), result, seal);
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

export const NebulaEdge = ({ fillColor, className = '' }: NebulaEdgeProps) => {
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

    // Observe wrapper, not canvas — canvas has no intrinsic size before first paint
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
      style={{ height: 120 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
