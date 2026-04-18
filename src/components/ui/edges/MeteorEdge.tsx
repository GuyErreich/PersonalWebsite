/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * MeteorEdge — Hero → GameDev transition.
 *
 * 7 glowing circular "space rocks" float along the seam between sections.
 * Each one bobs independently up and down using a sine wave, giving a
 * zero-gravity floating feel. Per-meteor: size, bob speed, bob amplitude,
 * phase offset. Rocky irregular edges via angle-modulated SDF. Warm
 * amber/crimson glow halos.  Star field fades in above the fill zone.
 */

import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { useScrollContainer } from "../../../lib/ScrollContainerContext";
import { buildGlProgram, hexToVec3 } from "../../../lib/webgl";

interface MeteorEdgeProps {
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

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  // ── Twinkle star field ────────────────────────────────────────────────────
  float stars(vec2 uv) {
    vec2  cell   = floor(uv * 180.0);
    vec2  local  = fract(uv * 180.0);
    float seed   = hash(cell.x * 127.1 + cell.y * 311.7);
    float bright = hash(seed + 0.7);
    vec2  spos   = vec2(hash(seed), hash(seed + 0.3));
    float d      = length(local - spos);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.9 + bright * 2.3) + seed * 6.28);
    return step(0.86, bright) * smoothstep(0.07, 0.0, d) * twinkle;
  }

  // ── One circular floating space-rock (pixel space) ────────────────────────
  //   idx  : float 0..6 used as hash seed
  //   px   : current pixel coordinate
  //   returns rgba to composite on top of background
  vec4 rock(float idx, vec2 px) {
    // ── Per-rock constants from hash ─────────────────────────────────────
    // Spread rocks evenly across X with a slight random nudge each
    float bx   = (idx + 0.5 + 0.55 * (hash(idx * 2.17) - 0.5)) / 7.0;
    float cx   = bx * uRes.x;

    // Bob parameters: independent frequency, amplitude, phase per rock
    float freq = 0.28 + hash(idx * 3.71) * 0.32;   // 0.28 .. 0.60 rad/s
    float ph   = hash(idx * 5.13) * 6.2832;          // random start phase
    float amp  = 24.0 + hash(idx * 7.91) * 22.0;    // ±24..46 px bob

    // Rocks float along the seam at ~55% of strip height (from bottom)
    float cy   = uRes.y * 0.55 + amp * sin(uTime * freq + ph);

    // Radius varies per rock: 20..36 px
    float rad  = 20.0 + hash(idx * 9.37) * 16.0;

    // ── Signed distance to irregular rocky edge ───────────────────────────
    vec2  dv  = px - vec2(cx, cy);
    float d   = length(dv);
    float ang = atan(dv.y, dv.x);

    // Warp radius with ~3 harmonics → cratered/lumpy silhouette
    float bump = 1.0
               + 0.14 * sin(ang * 5.0  + hash(idx       ) * 6.28)
               + 0.07 * sin(ang * 9.0  + hash(idx + 0.31) * 6.28)
               + 0.04 * sin(ang * 15.0 + hash(idx + 0.62) * 6.28);
    float effR   = rad * bump;
    float dEdge  = d - effR;   // < 0 = inside rock, > 0 = outside

    // ── Surface colour: warm white core → amber → dark crimson rim ────────
    float t     = clamp(d / max(effR, 0.001), 0.0, 1.0);
    vec3 cCore  = vec3(1.00, 0.97, 0.88);   // hot white centre
    vec3 cMid   = vec3(0.95, 0.52, 0.08);   // amber orange
    vec3 cRim   = vec3(0.55, 0.10, 0.02);   // dark crimson edge
    vec3 bodyCol = mix(cCore, mix(cMid, cRim, t * t), t);

    // ── AA disc fill (±1.5 px transition) ────────────────────────────────
    float fill  = 1.0 - smoothstep(-1.5, 1.5, dEdge);

    // ── Two-layered glow halo beyond the surface ─────────────────────────
    float outer  = max(0.0, dEdge);
    float glow1  = exp(-outer * 0.18) * 0.80;   // tight halo
    float glow2  = exp(-outer * 0.055) * 0.45;  // wide warm bloom
    vec3  glowC  = cMid * 1.4;

    // Composite: rock body takes priority, glow fills exterior
    vec3  col   = bodyCol * fill + glowC * (glow1 + glow2) * (1.0 - fill);
    float alpha = fill + (1.0 - fill) * clamp(glow1 + glow2, 0.0, 1.0);

    return vec4(col, alpha);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 px = gl_FragCoord.xy;

    // ── Background: fill at bottom fades to deep space above ─────────────
    float spaceFade = smoothstep(0.08, 0.55, uv.y);
    vec3  spaceCol  = vec3(0.006, 0.008, 0.028);
    vec3  bg        = mix(uFill, spaceCol, spaceFade);
    bg             += stars(uv) * spaceFade * 0.70;

    // ── Accumulate 7 floating rocks (alpha-composited front→back) ─────────
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 7; i++) {
      vec4 m     = rock(float(i), px);
      float pass = m.a * (1.0 - acc.a);
      acc.rgb   += m.rgb * pass;
      acc.a     += pass;
    }

    // Final composite: rocks over space over fill
    vec3 col = bg * (1.0 - acc.a) + acc.rgb;

    // ── Bottom seal: gradient over the bottom 50% of the strip → clean seam ─
    float seal = smoothstep(0.0, 0.50, uv.y);
    gl_FragColor = mix(vec4(uFill, 1.0), vec4(col, 1.0), seal);
  }
`;

export const MeteorEdge = ({ fillColor, className = "" }: MeteorEdgeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const container = useScrollContainer();
  const shouldRenderWebgl = useInView(wrapperRef, {
    root: container ?? undefined,
    margin: "30% 0px 30% 0px",
  });

  useEffect(() => {
    if (!shouldRenderWebgl) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const prog = buildGlProgram(gl, VERT, FRAG, "MeteorEdge");

    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "uTime");
    const uFill = gl.getUniformLocation(prog, "uFill");
    const uRes = gl.getUniformLocation(prog, "uRes");
    const [r, g, b] = hexToVec3(fillColor);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrapper.offsetWidth;
      const h = wrapper.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
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
  }, [fillColor, shouldRenderWebgl]);

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-x-0 bottom-0 pointer-events-none ${className}`}
      style={{ height: 160 }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
};
