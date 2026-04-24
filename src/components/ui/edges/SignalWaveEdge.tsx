/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * SignalWaveEdge — GameDev → DevOps transition.
 *
 * WebGL canvas strip with a GLSL fragment shader:
 *  - 5 animated sine-wave signal lines (oscilloscope / EQ-monitor aesthetic)
 *  - Per-wave: glow core + near halo + wide bloom, slow breathing pulse
 *  - Site-palette colours: cyan, emerald, violet, amber, blue
 *  - Faint sweeping horizontal scan line for extra life
 *  - Bottom seals to the next section's fill colour; top fades to transparent
 *
 * ResizeObserver watches the wrapper div for correct DPR-aware sizing.
 */

import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { useScrollContainer } from "../../../lib/ScrollContainerContext";
import { buildGlProgram, hexToVec3 } from "../../../lib/webgl";

interface SignalWaveEdgeProps {
  fillColor: string;
  className?: string;
  /** Flip vertically so the fill seals at the top (use at the top of a section). Default false. */
  inverted?: boolean;
  /** Strip height in px. Default 160. */
  height?: number;
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

  void main() {
    vec2  uv = gl_FragCoord.xy / uRes;
    float x  = uv.x;
    float y  = uv.y;   // 0 = canvas bottom (section seam), 1 = canvas top

    // ── 5 animated signal waves ──────────────────────────────────────────
    // Each: centre + multi-harmonic sine sum.  Centres span 0.48 – 0.66 (uv.y)
    float w0 = 0.56
      + 0.09 * sin(x * 4.3  + uTime * 0.62      )
      + 0.04 * sin(x * 10.1 - uTime * 1.15 + 1.4)
      + 0.02 * sin(x * 19.7 + uTime * 1.90 + 2.8);

    float w1 = 0.61
      + 0.07 * sin(x * 6.2  - uTime * 0.80 + 0.9 )
      + 0.03 * sin(x * 14.3 + uTime * 1.35 - 1.1 )
      + 0.015* sin(x * 25.8 - uTime * 1.85 + 3.4 );

    float w2 = 0.51
      + 0.06 * sin(x * 7.5  + uTime * 1.05 + 2.2 )
      + 0.03 * sin(x * 16.7 - uTime * 0.65 + 0.5 )
      + 0.02 * sin(x * 28.4 + uTime * 2.30 - 2.6 );

    float w3 = 0.66
      + 0.05 * sin(x * 5.9  - uTime * 1.25 + 4.1 )
      + 0.025* sin(x * 12.1 + uTime * 0.85 + 1.8 );

    float w4 = 0.48
      + 0.06 * sin(x * 9.1  + uTime * 0.72 - 0.8 )
      + 0.03 * sin(x * 20.8 - uTime * 1.75 + 3.7 );

    // Lift the signal band slightly so it does not clip against the bottom border.
    float yOffset = -0.24;
    w0 += yOffset;
    w1 += yOffset;
    w2 += yOffset;
    w3 += yOffset;
    w4 += yOffset;

    // ── Pixel-space distances for DPR-independent glow widths ─────────────
    float py = y * uRes.y;
    float d0 = abs(py - w0 * uRes.y);
    float d1 = abs(py - w1 * uRes.y);
    float d2 = abs(py - w2 * uRes.y);
    float d3 = abs(py - w3 * uRes.y);
    float d4 = abs(py - w4 * uRes.y);

    // ── Slow breathing pulse per wave ─────────────────────────────────────
    float p0 = 0.72 + 0.28 * sin(uTime * 0.90      );
    float p1 = 0.72 + 0.28 * sin(uTime * 1.10 + 1.2);
    float p2 = 0.72 + 0.28 * sin(uTime * 0.70 + 2.4);
    float p3 = 0.72 + 0.28 * sin(uTime * 1.30 - 0.8);
    float p4 = 0.72 + 0.28 * sin(uTime * 0.60 + 3.6);

    // ── Wave colours (site palette) ───────────────────────────────────────
    vec3 c0 = vec3(0.06, 0.82, 0.96);   // cyan
    vec3 c1 = vec3(0.07, 0.90, 0.55);   // emerald
    vec3 c2 = vec3(0.63, 0.38, 0.97);   // violet
    vec3 c3 = vec3(0.98, 0.68, 0.08);   // amber
    vec3 c4 = vec3(0.24, 0.48, 0.97);   // blue

    // ── Glow: narrow core (1-2 px) + near halo (~15 px) + wide bloom (~50 px)
    float g0 = exp(-d0 * 1.2) * 2.5 + exp(-d0 * 0.15) * 0.85 + exp(-d0 * 0.04) * 0.20;
    float g1 = exp(-d1 * 1.2) * 2.0 + exp(-d1 * 0.15) * 0.70 + exp(-d1 * 0.04) * 0.16;
    float g2 = exp(-d2 * 1.2) * 1.6 + exp(-d2 * 0.15) * 0.55 + exp(-d2 * 0.04) * 0.13;
    float g3 = exp(-d3 * 1.2) * 1.3 + exp(-d3 * 0.15) * 0.45 + exp(-d3 * 0.04) * 0.10;
    float g4 = exp(-d4 * 1.2) * 1.3 + exp(-d4 * 0.15) * 0.45 + exp(-d4 * 0.04) * 0.10;

    // Solid base so the edge is not transparent inside the band.
    vec3 col = uFill;
    col += c0 * g0 * p0;
    col += c1 * g1 * p1;
    col += c2 * g2 * p2;
    col += c3 * g3 * p3;
    col += c4 * g4 * p4;

    // ── Faint sweeping scan line — slow horizontal band drifting upward ───
    float scanY  = fract(uTime * 0.27) * 0.55 + 0.28;
    float scanDy = abs(y - scanY) * uRes.y;
    col += vec3(0.30, 0.55, 0.85) * exp(-scanDy * 0.16) * 0.09;

    // Slightly softer gain so section seam colours remain visible.
    col *= 1.08;

    // ── Fixed straight borders for signal band ─────────────────────────────
    // Bottom border is a perfectly straight line filled with section color.
    float bandBottom = 0.09;
    // Top border pulled down so wave-to-border gap matches the bottom spacing.
    float bandTop = 0.56;

    // Smudged straight borders: keep lines straight but feather their transition.
    float borderNoise = (fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.0032;
    float bottomFeather = 0.042;
    float topFeather = 0.078;

    // 0 below bottom border, 1 inside the signal band (with feather + dither).
    float bottomMask = smoothstep(
      bandBottom - bottomFeather,
      bandBottom + bottomFeather,
      y + borderNoise
    );
    // Keep fill-colour sealing only on the seam, not across the full lower band.
    float fillBlend = smoothstep(bandBottom - 0.010, bandBottom + 0.012, y + borderNoise);
    col = mix(uFill, col, fillBlend);

    // 1 inside signal band, 0 above top border (with feather + dither).
    float topMask = 1.0 - smoothstep(
      bandTop - topFeather,
      bandTop + topFeather,
      y + borderNoise
    );
    // Mostly opaque within the band, but let seam colour read through a touch.
    float alpha = clamp(bottomMask * topMask * 0.88, 0.0, 1.0);

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export const SignalWaveEdge = ({
  fillColor,
  className = "",
  inverted = false,
  height = 160,
}: SignalWaveEdgeProps) => {
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

    const prog = buildGlProgram(gl, VERT, FRAG, "SignalWaveEdge");

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

  const posClass = inverted ? "top-0 scale-y-[-1]" : "bottom-0";

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-x-0 ${posClass} pointer-events-none ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
};
