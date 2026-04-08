/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import gsap from "gsap";
import { type DependencyList, useRef } from "react";

/**
 * Custom hook to build and maintain an AnimationOrchestrator.
 * Uses reference identity for both `builder` and `deps` — the same semantics
 * as `useMemo`. Vite HMR replaces the `builder` function reference whenever
 * the source module is edited, so rebuilds happen automatically on HMR.
 */
export function useBuildOrchestrator(
  builder: () => AnimationOrchestrator,
  deps: DependencyList = [],
) {
  const cacheRef = useRef<{
    builder: () => AnimationOrchestrator;
    deps: DependencyList;
    result: AnimationOrchestrator;
  } | null>(null);

  const depsChanged =
    cacheRef.current === null ||
    cacheRef.current.deps.length !== deps.length ||
    cacheRef.current.deps.some((d, i) => !Object.is(d, deps[i]));

  if (cacheRef.current === null || cacheRef.current.builder !== builder || depsChanged) {
    cacheRef.current = { builder, deps, result: builder() };
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
