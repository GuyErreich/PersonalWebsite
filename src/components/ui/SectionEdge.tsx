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
}

export const SectionEdge = ({ variant, fillColor, className = '' }: SectionEdgeProps) => {
  if (variant === 'terrain') {
    return <NebulaEdge  fillColor={fillColor} className={className} />;
  }
  if (variant === 'meteor') {
    return <MeteorEdge  fillColor={fillColor} className={className} />;
  }
  if (variant === 'circuit') {
    return <SkylineEdge fillColor={fillColor} className={className} />;
  }
  return <CloudEdge fillColor={fillColor} className={className} />;
};
