/**
 * CloudEdge — DevOps → Footer transition.
 *
 * Pure SVG with an animated feTurbulence + feDisplacementMap filter pipeline.
 * The base paths are organic cumulus cloud formations; the displacement filter
 * makes them breathe and billow in real time — zero JS per frame, GPU composited.
 *
 * A subtle cyan glow is rendered on the top silhouette only (open stroke path).
 * The bottom fill is the next section's exact background colour.
 */

import { useEffect, useId, useRef } from "react";

interface CloudEdgeProps {
  fillColor: string;
  className?: string;
}

// ── Cloud fill path (closed, fills downward with fillColor) ────────────────
const FILL_PATH = [
  "M0,80 L0,70",
  "C20,65 38,56 54,46",
  "C70,36 88,34 104,40",
  "C120,46 133,58 152,66",
  "C171,74 190,76 208,70",
  "C226,64 240,54 256,44",
  "C272,34 290,30 306,36",
  "C322,42 334,56 352,66",
  "C370,76 390,78 410,72",
  "C430,66 444,56 460,46",
  "C476,36 494,32 510,38",
  "C526,44 538,58 556,68",
  "C574,78 595,80 616,74",
  "C637,68 652,56 668,44",
  "C684,32 700,28 716,34",
  "C732,40 744,54 762,64",
  "C780,74 800,78 820,72",
  "C840,66 855,56 872,46",
  "C889,36 907,34 924,42",
  "C941,50 953,62 972,70",
  "C991,78 1014,80 1036,74",
  "C1058,68 1073,58 1090,50",
  "C1107,42 1124,42 1140,50",
  "C1156,58 1168,68 1188,74",
  "C1208,80 1240,80 1276,74",
  "C1312,68 1365,70 1440,70",
  "L1440,80 Z",
].join(" ");

// ── Stroke path (open — top silhouette only, no bottom/sides) ─────────────
const STROKE_PATH = [
  "M0,70",
  "C20,65 38,56 54,46",
  "C70,36 88,34 104,40",
  "C120,46 133,58 152,66",
  "C171,74 190,76 208,70",
  "C226,64 240,54 256,44",
  "C272,34 290,30 306,36",
  "C322,42 334,56 352,66",
  "C370,76 390,78 410,72",
  "C430,66 444,56 460,46",
  "C476,36 494,32 510,38",
  "C526,44 538,58 556,68",
  "C574,78 595,80 616,74",
  "C637,68 652,56 668,44",
  "C684,32 700,28 716,34",
  "C732,40 744,54 762,64",
  "C780,74 800,78 820,72",
  "C840,66 855,56 872,46",
  "C889,36 907,34 924,42",
  "C941,50 953,62 972,70",
  "C991,78 1014,80 1036,74",
  "C1058,68 1073,58 1090,50",
  "C1107,42 1124,42 1140,50",
  "C1156,58 1168,68 1188,74",
  "C1208,80 1240,80 1276,74",
  "C1312,68 1365,70 1440,70",
].join(" ");

// ── Component ──────────────────────────────────────────────────────────────
export const CloudEdge = ({ fillColor, className = "" }: CloudEdgeProps) => {
  // Per-instance filter IDs — prevents collisions when multiple CloudEdges render.
  const uid = useId();
  const displaceId = `cloud-displace-${uid}`;
  const glowId = `cloud-glow-${uid}`;

  // Animate the turbulence baseFrequency via a ref so we avoid React re-renders.
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = turbRef.current;
    if (!el) return;

    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      // Slowly drift the turbulence seed so the clouds billow organically
      const bfX = 0.008 + 0.002 * Math.sin(t * 0.18);
      const bfY = 0.012 + 0.002 * Math.cos(t * 0.13);
      el.setAttribute("baseFrequency", `${bfX.toFixed(4)} ${bfY.toFixed(4)}`);
      el.setAttribute("seed", String(Math.floor(t * 0.4) % 999));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 pointer-events-none ${className}`}
      style={{ height: 100 }}
    >
      {/* Bloom radial behind the clouds — centred at 60% so it never reaches the bottom seam */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 60%, rgba(6,182,212,0.10) 0%, transparent 100%)",
        }}
      />

      {/* Bottom seal: smooth 50% gradient into fillColor so the seam is clean */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "50%",
          background: `linear-gradient(to top, ${fillColor} 0%, transparent 100%)`,
        }}
      />

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <defs>
          {/* Displacement filter — makes the cloud paths breathe */}
          <filter
            id={displaceId}
            x="-5%"
            y="-30%"
            width="110%"
            height="160%"
            colorInterpolationFilters="linearRGB"
          >
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.008 0.012"
              numOctaves={4}
              seed={42}
              result="turb"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turb"
              scale={6}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Glow filter for the stroke line */}
          <filter id={glowId} x="-2%" y="-80%" width="104%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fill — displaced with the turbulence filter */}
        <g filter={`url(#${displaceId})`}>
          <path d={FILL_PATH} fill={fillColor} />
        </g>

        {/* Glow stroke — only the silhouette edge, same displacement */}
        <g filter={`url(#${displaceId})`}>
          <path
            d={STROKE_PATH}
            fill="none"
            stroke="rgba(6,182,212,0.45)"
            strokeWidth="1.8"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        </g>
      </svg>
    </div>
  );
};
