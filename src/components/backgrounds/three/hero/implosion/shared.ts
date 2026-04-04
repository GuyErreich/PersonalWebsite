const implosionDuration = 3.0; // The active duration of the collapse phase
const entryDelay = 4.8; // Starts right near the end of the text collapse

// EXACT shared math extracted from the single file's useFrame
export const getImplosionState = (t: number) => {
    const activeT = t - entryDelay;
    const activeDuration = implosionDuration;
    const progress = activeT / activeDuration;
    
    let expandCollapse = 0;
    if (progress > 0.45 && progress <= 0.78) {
        const outProgress = (progress - 0.45) / 0.33;
        expandCollapse = Math.pow(outProgress, 2.0);
    } else if (progress > 0.78 && progress <= 0.88) {
        const inProgress = (0.88 - progress) / 0.10;
        expandCollapse = Math.pow(inProgress, 0.5); 
    } else if (progress > 0.88) {
        expandCollapse = 0;
    }
    
    const ringDelay = 0.08; 
    const ringActiveT = Math.max(0, activeT - ringDelay);

    let introBounce = 1.0;
    if (activeT < 0.6) {
      const x = activeT / 0.6; 
      const c1 = 1.70158;
      const c3 = c1 + 1;
      introBounce = Math.max(0, 1.0 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2));
    }
    
    let ringBounce = 1.0;
    if (ringActiveT < 0.6) {
      const rx = ringActiveT / 0.6; 
      const c1 = 1.70158;
      const c3 = c1 + 1;
      ringBounce = Math.max(0, 1.0 + c3 * Math.pow(rx - 1, 3) + c1 * Math.pow(rx - 1, 2));
    }
    
    const currentScale = (1.0 + (expandCollapse * 1.8)) * ringBounce;
    
    let finalPinch = 1.0;
    if (progress > 0.88) {
        finalPinch = Math.max(0, 1.0 - (progress - 0.88) * (1.0 / 0.12));
    }

    return { activeT, activeDuration, progress, expandCollapse, ringActiveT, introBounce, ringBounce, currentScale, finalPinch };
};
