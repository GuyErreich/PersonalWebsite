/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import gsap from "gsap";
import { type DependencyList, useRef } from "react";

/**
 * Custom hook to securely build and maintain an AnimationOrchestrator.
 * It strictly tracks the stringified content of the builder function.
 * This GUARANTEES that Vite Hot Module Reloading (HMR) will instantly rebuild
 * the orchestrator whenever you safely tweak numbers or durations inline.
 */
export function useBuildOrchestrator(
  builder: () => AnimationOrchestrator,
  deps: DependencyList = [],
) {
  // Ref-based manual cache — avoids useMemo's dependency-array lint restrictions while
  // preserving HMR-triggered rebuilds: builderKey changes whenever the function body
  // is edited, and depsKey changes when the caller's extra deps change.
  const builderKey = builder.toString();
  const depsKey = JSON.stringify(deps);
  const cacheRef = useRef<{
    builderKey: string;
    depsKey: string;
    result: AnimationOrchestrator;
  } | null>(null);
  if (
    cacheRef.current === null ||
    cacheRef.current.builderKey !== builderKey ||
    cacheRef.current.depsKey !== depsKey
  ) {
    cacheRef.current = { builderKey, depsKey, result: builder() };
  }
  return cacheRef.current.result;
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
    const actualStartTime = this.globalDelay + this.globalDuration * delayMultiplier;
    this.registerAbsolute(name, actualDuration, actualStartTime);
  }

  public registerAbsolute(name: string, duration: number, startTime: number) {
    if (!this.proxies[name]) {
      this.proxies[name] = { progress: 0, activeT: 0, duration: duration };
    } else {
      this.proxies[name].duration = duration;
    }

    this.mainTimeline.to(
      this.proxies[name],
      {
        progress: 1.0,
        activeT: duration,
        duration: duration,
        ease: "none",
      },
      startTime,
    );
  }

  public getProxy(name: string): ProxyState {
    if (!this.proxies[name]) {
      this.proxies[name] = { progress: 0, activeT: 0, duration: 0 };
    }
    return this.proxies[name];
  }

  public playScenario(skipIntro: boolean, onComplete?: () => void) {
    // Always register the callback first — GSAP won't fire it on manual progress() calls,
    // so for skipIntro we invoke it explicitly below.
    if (onComplete) {
      this.mainTimeline.eventCallback("onComplete", onComplete);
    }
    if (skipIntro) {
      this.mainTimeline.progress(1.0);
      onComplete?.();
    } else {
      this.mainTimeline.restart();
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
    this.mainTimeline.eventCallback("onComplete", cb);
  }

  public kill() {
    this.mainTimeline.kill();
  }
}
