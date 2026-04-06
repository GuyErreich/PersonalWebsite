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
  /** Flip vertically so the glow rises from below (top edge of next section) */
  inverted?: boolean;
  /** Strip height in px. Default 120. Reduce to narrow the divider. */
  height?: number;
  /** Multiplier on all wave amplitudes. >1 taller waves, <1 shallower. Default 1. */
  waveAmp?: number;
  /** Multiplier on all spatial wave frequencies. >1 more compact, <1 wider. Default 1. */
  waveFreq?: number;
  /** Multiplier on storm (disruption) injection amplitudes. Default 1. */
  stormAmp?: number;
  /** Multiplier on storm (disruption) spatial frequencies. Default 1. */
  stormFreq?: number;
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
  uniform float uWaveAmp;
  uniform float uWaveFreq;
  uniform float uStormAmp;
  uniform float uStormFreq;
  uniform vec3  uFill;
  uniform vec2  uRes;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  // Scalar hash — used by the disruption slot system
  float hash(float n) { return fract(sin(n) * 43758.5453); }

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
    float rt = uTime;   // raw time, unscaled — used for disruption slots

    // ── Shared cloud noise fields ────────────────────────────────────────
    float cA = fbm(vec2(uv.x * 2.0 - t * 0.18, uv.y * 1.4 + t * 0.10));
    float cB = fbm(vec2(uv.x * 1.5 + t * 0.12, uv.y * 1.9 - t * 0.07));
    float cx = fbm(vec2(uv.x * 1.3 + t * 0.28, t * 0.14));

    // ════════════════════════════════════════════════════════════════════
    // DISCRETE DISRUPTION SYSTEM — sweeping wavefront model
    //
    // All wavefronts travel at the same fixed speed (travelSpeed uv/s).
    // Only frequency (compactness) and amplitude (height) differ per slot.
    // Three slots are time-staggered by 1.5 s so they fire independently.
    // The front is unclamped so it exits naturally — no static hold.
    // ════════════════════════════════════════════════════════════════════
    float travelSpeed = 0.38;  // uv/s for all slots — full crossing ~2.6 s

    // ── Slot A: medium-freq waves (12..30 cyc/uv) ─────────────────────
    // Window 4.5 s → front exits at ~2.6 s, trail clears at ~3.8 s.
    float slotWA   = 4.5;
    float slotA    = floor(rt / slotWA);
    float slotTA   = fract(rt / slotWA);
    float rA1      = hash(slotA * 127.3 + 41.7);  // fire decision
    float rA2      = hash(slotA * 311.7 + 89.1);  // frequency
    float rA3      = hash(slotA * 473.1 + 17.3);  // direction
    float disruptA = step(0.70, rA1);             // fires ~30% of slots
    float freqA    = uStormFreq * (12.0 + rA2 * 18.0);  // 12..30 cycles/uv
    float ampA     = uStormAmp  * (0.07 + rA1 * 0.09);  // 0.07..0.16
    // tA: unclamped travel distance — front exits screen naturally
    float tA       = slotTA * slotWA * travelSpeed;
    float frontA   = rA3 > 0.5 ? tA : (1.0 - tA);
    float behindA  = rA3 > 0.5 ? (frontA - uv.x) : (uv.x - frontA);
    float wEnvA    = smoothstep(-0.01, 0.03, behindA) * smoothstep(0.45, 0.08, behindA);
    float injA     = disruptA * ampA * wEnvA * sin(uv.x * freqA - rt * 4.5);

    // ── Slot B: compact waves (24..46 cyc/uv) — stagger +1.5 s ───────
    float slotWB   = 4.5;
    float slotB    = floor((rt + 1.5) / slotWB);
    float slotTB   = fract((rt + 1.5) / slotWB);
    float rB1      = hash(slotB * 223.1 + 157.9);
    float rB2      = hash(slotB * 419.3 + 73.3);
    float rB3      = hash(slotB * 631.7 + 29.1);
    float disruptB = step(0.75, rB1);             // fires ~25% of slots
    float freqB    = uStormFreq * (24.0 + rB2 * 22.0);  // 24..46 cycles/uv
    float ampB     = uStormAmp  * (0.045 + rB1 * 0.055); // 0.045..0.10
    float tB       = slotTB * slotWB * travelSpeed;
    float frontB   = rB3 > 0.5 ? tB : (1.0 - tB);
    float behindB  = rB3 > 0.5 ? (frontB - uv.x) : (uv.x - frontB);
    float wEnvB    = smoothstep(-0.01, 0.03, behindB) * smoothstep(0.45, 0.08, behindB);
    float injB     = disruptB * ampB * wEnvB * sin(uv.x * freqB + rt * 4.5);

    // ── Slot C: fine jagged spikes (38..66 cyc/uv) — stagger +3.0 s ──
    float slotWC   = 4.5;
    float slotC    = floor((rt + 3.0) / slotWC);
    float slotTC   = fract((rt + 3.0) / slotWC);
    float rC1      = hash(slotC * 97.7 + 331.1);
    float rC2      = hash(slotC * 503.3 + 211.7);
    float rC3      = hash(slotC * 743.9 + 53.7);
    float disruptC = step(0.80, rC1);             // fires ~20% of slots
    float freqC    = uStormFreq * (38.0 + rC2 * 28.0);  // 38..66 cycles/uv
    float ampC     = uStormAmp  * (0.04 + rC1 * 0.06);  // 0.04..0.10
    float tC       = slotTC * slotWC * travelSpeed;
    float frontC   = rC3 > 0.5 ? tC : (1.0 - tC);
    float behindC  = rC3 > 0.5 ? (frontC - uv.x) : (uv.x - frontC);
    float wEnvC    = smoothstep(-0.01, 0.03, behindC) * smoothstep(0.40, 0.08, behindC);
    float injC     = disruptC * ampC * wEnvC * sin(uv.x * freqC - rt * 4.5);

    // ── Combined disruption envelope (for emission line brightening) ─────
    float disruption = clamp(disruptA * wEnvA + disruptB * wEnvB + disruptC * wEnvC, 0.0, 1.0);

    // ── Layer 0: Deep background nebula ─────────────────────────────────
    float h0 = 0.35
      + uWaveAmp * 0.025 * sin(uv.x * uWaveFreq * 1.43 + t * 0.62)
      + uWaveAmp * 0.018 * sin(uv.x * uWaveFreq * 2.71 - t * 0.83)
      + uWaveAmp * 0.018 * gradNoise(vec2(uv.x * 1.1 + t * 0.28, t * 0.21));
    float d0   = uv.y - h0;
    float b0   = pow(clamp(1.0 - d0 / 0.55, 0.0, 1.0), 3.0);
    vec3  col0 = vec3(0.08, 0.02, 0.30) * b0 * (0.42 + 0.58 * (cB * 0.5 + 0.5));
    float a0   = b0 * 0.38;
    float e0   = exp(-abs(d0) * uRes.y * 1.5) * 0.40;
    col0 += vec3(0.32, 0.07, 0.72) * e0;
    a0   += e0 * 0.25;

    // ── Layer 1: Mid-ground horizon ──────────────────────────────────────
    float h1 = 0.44
      + uWaveAmp * 0.038 * sin(uv.x * uWaveFreq * 1.97 + t * 1.05)
      + uWaveAmp * 0.030 * sin(uv.x * uWaveFreq * 3.41 - t * 1.62)
      + uWaveAmp * 0.020 * sin(uv.x * uWaveFreq * 5.83 + t * 0.97)
      + uWaveAmp * 0.030 * fbm(vec2(uv.x * 1.2 - t * 0.55, t * 0.33));
    float d1   = uv.y - h1;
    float b1   = pow(clamp(1.0 - d1 / 0.26, 0.0, 1.0), 1.8);
    float den1 = b1 * (0.50 + 0.50 * (cA * 0.5 + 0.5));
    vec3  col1 = mix(vec3(0.28, 0.06, 0.60), vec3(0.54, 0.36, 0.97), b1) * den1;
    col1      *= (0.60 + 0.40 * (cA * 0.5 + 0.5));
    float a1   = den1 * 0.50;
    float e1   = exp(-abs(d1) * uRes.y * 1.1) * 0.80;
    col1 += vec3(0.54, 0.36, 0.97) * 0.70 * e1;
    a1   += e1 * 0.28;

    // ── Layer 2: Main (front) horizon — base calm + disruption injections ─
    // Base terms are unchanged — calm nebula at normal amplitude.
    // The three injection signals (injA/B/C) are summed on top: they are
    // deliberately high-slope so the horizon shreds into chaotic fragments,
    // exactly like a signal being jammed.
    float h2 = 0.50
      + uWaveAmp * 0.050 * sin(uv.x * uWaveFreq * 2.31 + t * 1.70)
      + uWaveAmp * 0.042 * sin(uv.x * uWaveFreq * 3.73 - t * 2.41)
      + uWaveAmp * 0.030 * sin(uv.x * uWaveFreq * 5.17 + t * 1.53)
      + uWaveAmp * 0.020 * sin(uv.x * uWaveFreq * 7.11 - t * 3.10)
      + uWaveAmp * 0.014 * sin(uv.x * uWaveFreq * 8.97 + t * 2.07)
      + uWaveAmp * 0.045 * fbm(vec2(uv.x * 1.6 + t * 0.70, t * 0.48))
      + injA + injB + injC;
    float d2  = uv.y - h2;

    float aaH  = 1.5 / uRes.y;
    float fill = smoothstep(-aaH, aaH, d2);

    float b2   = clamp(1.0 - d2 / 0.20, 0.0, 1.0);
    float den2 = b2 * (0.60 + 0.40 * (cA * 0.45 + 0.55));
    vec3  col2 = mix(
      vec3(0.063, 0.725, 0.506),
      mix(vec3(0.024, 0.714, 0.831), vec3(0.54, 0.36, 0.97), cx + 0.4),
      b2 * 0.7 + 0.2
    );
    col2 *= (0.68 + 0.32 * (cB * 0.5 + 0.5));

    float hot = clamp((cA + 0.3) * (cx + 0.3) * 3.0, 0.0, 1.0) * b2;
    col2 += vec3(0.024, 0.714, 0.831) * hot * 0.55;

    // Emission line: flares white instantly when any disruption fires
    float e2  = exp(-abs(d2) * uRes.y * 0.7) * (1.8 + 3.2 * disruption);
    col2 += e2 * mix(vec3(0.024, 0.714, 0.831), vec3(1.0), 0.4);

    float pulse = 0.85 + 0.15 * sin(uTime * 1.2 + uv.x * 2.8);
    float a2    = den2 * den2 * pulse * 0.72 + e2 * 0.60;

    // ── Sub-horizon scatter ────────────────────────────────────────────────
    float scatterFade = smoothstep(0.0, 0.22, uv.y);
    float below   = clamp(-d2 / 0.06, 0.0, 1.0) * scatterFade;
    vec3  subFill = uFill + vec3(0.063, 0.725, 0.506) * 0.28 * below * below;

    // ── Composite ─────────────────────────────────────────────────────────
    vec3  glow = col0 * a0 + col1 * a1 + col2 * a2;
    float gA   = clamp(a0 * 0.55 + a1 * 0.65 + a2, 0.0, 1.0);

    vec4 result = mix(
      vec4(subFill, 1.0),
      vec4(glow, gA),
      fill
    );

    // ── Bottom seal: smooth 50% blend into next section colour ────────────
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
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[NebulaEdge] GLSL compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[NebulaEdge] GLSL link error:', gl.getProgramInfoLog(prog));
  }
  return prog;
}

export const NebulaEdge = ({ fillColor, className = '', inverted = false, height = 120, waveAmp = 1.0, waveFreq = 1.0, stormAmp = 1.0, stormFreq = 1.0 }: NebulaEdgeProps) => {
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

    const uTime     = gl.getUniformLocation(prog, 'uTime');
    const uWaveAmpL  = gl.getUniformLocation(prog, 'uWaveAmp');
    const uWaveFreqL = gl.getUniformLocation(prog, 'uWaveFreq');
    const uStormAmpL = gl.getUniformLocation(prog, 'uStormAmp');
    const uStormFreqL = gl.getUniformLocation(prog, 'uStormFreq');
    const uFill     = gl.getUniformLocation(prog, 'uFill');
    const uRes      = gl.getUniformLocation(prog, 'uRes');
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
      gl.uniform1f(uWaveAmpL, waveAmp);
      gl.uniform1f(uWaveFreqL, waveFreq);
      gl.uniform1f(uStormAmpL, stormAmp);
      gl.uniform1f(uStormFreqL, stormFreq);
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
  }, [fillColor, waveAmp, waveFreq, stormAmp, stormFreq]);

  const posClass = inverted ? 'top-0 scale-y-[-1]' : 'bottom-0';

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-x-0 ${posClass} pointer-events-none ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};
