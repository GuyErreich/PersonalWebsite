import gsap from 'gsap';

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

        if (!this.proxies[name]) {
            this.proxies[name] = { progress: 0, activeT: 0, duration: actualDuration };
        } else {
            this.proxies[name].duration = actualDuration;
        }
        
        this.mainTimeline.to(this.proxies[name], {
            progress: 1.0,
            activeT: actualDuration,
            duration: actualDuration,
            ease: "none"
        }, actualStartTime);
    }

    public getProxy(name: string): ProxyState {
        if (!this.proxies[name]) {
             this.proxies[name] = { progress: 0, activeT: 0, duration: 0 };
        }
        return this.proxies[name];
    }
    
    public play() {
        console.log("Playing main timeline");
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
