import { useId } from 'react';

interface SectionDividerProps {
  /**
   * gamedev  — hero (#111827) → game-dev (#111827), emerald/purple clouds
   * devops   — game-dev (#111827) → devops (#030712), cyan clouds
   * default  — devops (#030712) → footer (#111827), neutral clouds
   */
  variant?: 'default' | 'gamedev' | 'devops';
}

// [topHex, bottomHex, blob colors ...]
const CONFIG = {
  gamedev: {
    top:    '#111827',
    bottom: '#111827',
    blobs: [
      'radial-gradient(ellipse 100% 300% at 48% 50%, rgba(16,185,129,0.11) 0%, transparent 65%)',
      'radial-gradient(ellipse  65% 200% at 54% 50%, rgba(124,58,237,0.09) 0%, transparent 65%)',
      'radial-gradient(ellipse  38% 120% at 50% 50%, rgba(6,182,212,0.07)  0%, transparent 65%)',
    ],
  },
  devops: {
    top:    '#111827',
    bottom: '#030712',
    blobs: [
      'radial-gradient(ellipse 100% 300% at 50% 50%, rgba(6,182,212,0.11)  0%, transparent 65%)',
      'radial-gradient(ellipse  60% 180% at 46% 50%, rgba(16,185,129,0.06) 0%, transparent 65%)',
      'radial-gradient(ellipse  35% 110% at 52% 50%, rgba(6,182,212,0.09)  0%, transparent 65%)',
    ],
  },
  default: {
    top:    '#030712',
    bottom: '#111827',
    blobs: [
      'radial-gradient(ellipse 100% 300% at 50% 50%, rgba(6,182,212,0.08)  0%, transparent 65%)',
      'radial-gradient(ellipse  55% 160% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 65%)',
    ],
  },
} as const;

export const SectionDivider = ({ variant = 'default' }: SectionDividerProps) => {
  const uid = useId().replace(/:/g, '');
  const { top, bottom, blobs } = CONFIG[variant];

  return (
    <div
      className="relative w-full overflow-hidden pointer-events-none select-none"
      style={{ height: 280, background: top }}
    >
      {/*
        SVG noise filter — feTurbulence warps the blob edges into organic wispy
        boundaries so no clean gradient line is ever visible.
      */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id={uid} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.008"
              numOctaves="4"
              seed="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="38"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Colour cloud blobs — filtered with the noise warp */}
      <div
        className="absolute inset-0"
        style={{ filter: `url(#${uid})` }}
      >
        {blobs.map((bg, i) => (
          <div key={i} className="absolute inset-0" style={{ background: bg }} />
        ))}
      </div>

      {/*
        Top mask  — exact hex of the section above so it dissolves seamlessly
        Bottom mask — exact hex of the section below
        Together they consume 40% from each edge, leaving only the central 20%
        as a soft atmospheric glow. Zero perceptible boundary with either section.
      */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `linear-gradient(to bottom,
            ${top} 0%,
            transparent 38%,
            transparent 62%,
            ${bottom} 100%
          )`,
        }}
      />
    </div>
  );
};


