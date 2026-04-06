/**
 * SectionEdge — section transition dispatcher.
 *
 * Switches between animated edge components based on `variant`:
 *  - terrain  →  NebulaEdge   (reserved)          GLSL plasma horizon
 *  - meteor   →  MeteorEdge   (Hero → GameDev)     GLSL meteor shower
 *  - circuit  →  SkylineEdge  (GameDev → DevOps)   GLSL cyberpunk skyline
 *  - wave     →  CloudEdge    (DevOps → Footer)    SVG feTurbulence clouds
 */

import { NebulaEdge }  from './edges/NebulaEdge';
import { MeteorEdge }  from './edges/MeteorEdge';
import { SkylineEdge } from './edges/SkylineEdge';
import { CloudEdge }   from './edges/CloudEdge';

export interface SectionEdgeProps {
  variant: 'terrain' | 'meteor' | 'circuit' | 'wave';
  /** Exact bg colour of the section immediately below */
  fillColor: string;
  className?: string;
  /** Flip NebulaEdge vertically so the glow rises from below */
  inverted?: boolean;
  /** Strip height in px (NebulaEdge only). Default 120. */
  height?: number;
  /** Wave amplitude multiplier — >1 taller, <1 shallower. Default 1. */
  waveAmp?: number;
  /** Wave frequency multiplier — >1 more compact, <1 wider. Default 1. */
  waveFreq?: number;
  /** Storm amplitude multiplier. Default 1. */
  stormAmp?: number;
  /** Storm frequency multiplier. Default 1. */
  stormFreq?: number;
}

export const SectionEdge = ({ variant, fillColor, className = '', inverted = false, height, waveAmp, waveFreq, stormAmp, stormFreq }: SectionEdgeProps) => {
  if (variant === 'terrain') {
    return <NebulaEdge fillColor={fillColor} className={className} inverted={inverted} height={height} waveAmp={waveAmp} waveFreq={waveFreq} stormAmp={stormAmp} stormFreq={stormFreq} />;
  }
  if (variant === 'meteor') {
    return <MeteorEdge  fillColor={fillColor} className={className} />;
  }
  if (variant === 'circuit') {
    return <SkylineEdge fillColor={fillColor} className={className} />;
  }
  return <CloudEdge fillColor={fillColor} className={className} />;
};
