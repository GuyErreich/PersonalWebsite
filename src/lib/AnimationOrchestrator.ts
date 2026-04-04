import gsap from 'gsap';
import { useMemo, type DependencyList } from 'react';

/**
 * Custom hook to securely build and maintain an AnimationOrchestrator.
 * It strictly tracks the stringified content of the builder function.
 * This GUARANTEES that Vite Hot Module Reloading (HMR) will instantly rebuild
 * the orchestrator whenever you safely tweak numbers or durations inline.
 */
export function useBuildOrchestrator(builder: () => AnimationOrchestrator, deps: DependencyList = []) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(builder, [builder.toString(), ...deps]);
}

export interface ProxyState {
  progress: number;
  activeT: number;
  duration: number;
}

export class AnimationOrchestrator {
    public mainTimeline: gsap.core.Timeline;
    public proxies: Record<string, ProxyState> = {};
    public globalDuration: number = 1;
    public globalDelay: number = 0;

    constructor() {
        this.mainTimeline = gsap.timeline({ paused: true });
    }

    public setGlobalTiming(duration: number, delay: number) {
        this.globalDuration = duration;
        this.globalDelay = delay;
        // Register the master timeline automatically
        this.register("master", 1.0, 0.0);
    }

    public register(name: string, durationMultiplier: number, delayMultiplier: number = 0) {
        const actualDuration = this.globalDuration * durationMultiplier;
        const actualStartTime = this.globalDelay + (this.globalDuration * delayMultiplier);
        this.registerAbsolute(name, actualDuration, actualStartTime);
    }

    public registerAbsolute(name: string, duration: number, startTime: number) {
        if (!this.proxies[name]) {
            this.proxies[name] = { progress: 0, activeT: 0, duration: duration };
        } else {
            this.proxies[name].duration = duration;
        }
        
        this.mainTimeline.to(this.proxies[name], {
            progress: 1.0,
            activeT: duration,
            duration: duration,
            ease: "none"
        }, startTime);
    }

    public getProxy(name: string): ProxyState {
        if (!this.proxies[name]) {
             this.proxies[name] = { progress: 0, activeT: 0, duration: 0 };
        }
        return this.proxies[name];
    }
    
    public playScenario(skipIntro: boolean, onComplete?: () => void) {
        if (skipIntro) {
            this.mainTimeline.progress(1.0);
        } else {
            this.mainTimeline.restart();
        }
        if (onComplete) {
            this.mainTimeline.eventCallback('onComplete', onComplete);
        }
    }

    // Removed createBlock as it was causing unnecessary HOC wrappings
    
    public play() {
        this.mainTimeline.play(0);
    }
    
    public completeImmediately() {
        this.mainTimeline.progress(1.0);
    }

    public setOnComplete(cb: () => void) {
        this.mainTimeline.eventCallback('onComplete', cb);
    }

    public kill() {
        this.mainTimeline.kill();
    }
}
