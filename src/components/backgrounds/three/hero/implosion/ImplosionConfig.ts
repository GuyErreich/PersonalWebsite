import { AnimationOrchestrator } from '../../../../../lib/AnimationOrchestrator';

export const implosionEvents = new AnimationOrchestrator();

// Base timing configs
const IMPLOSION_DURATION = 3.0;
const ENTRY_DELAY = 4.8;

// Initialize global timing
implosionEvents.setGlobalTiming(IMPLOSION_DURATION, ENTRY_DELAY);

// Register sub-components with relative multipliers (Duration %, Delay %)
// This automatically calculates timing relative to the global animation parameters
// implosionEvents.register("blackhole",  0.8,  0.05);
// implosionEvents.register("ripples",    0.9,  0.10);
// implosionEvents.register("dust",       1.0,  0.00);
// implosionEvents.register("rings",      0.95, 0.05);
// implosionEvents.register("blueDust",   0.9,  0.00);

implosionEvents.register("blackhole",  0.8,  0.05);
implosionEvents.register("ripples",    0.82,  0.10);
implosionEvents.register("dust",       0.95,  0.00);
implosionEvents.register("rings",      0.75, 0.05);
implosionEvents.register("blueDust",   0.8,  0.00);

export const buildImplosionTimeline = (skipIntro: boolean, onComplete?: () => void) => {
    if (skipIntro) {
        implosionEvents.mainTimeline.progress(1.0);
    } else {
        implosionEvents.mainTimeline.restart();
    }
    if (onComplete) {
        implosionEvents.mainTimeline.eventCallback("onComplete", onComplete);
    }
};

