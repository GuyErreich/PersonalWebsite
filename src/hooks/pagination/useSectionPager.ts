/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { type RefObject, useEffect } from "react";
import { isMidTierOrConstrainedDevice } from "../../lib/performance";
import { PAGE_SCROLL_DURATION_MS, PAGE_SCROLL_LOCK_MS } from "./sectionPager/constants";
import { createSectionPagerHandlers } from "./sectionPager/handlers";
import {
  canPageFromTarget,
  easeInOutCubic,
  getClosestSectionIndex,
  getTargetScrollTop,
} from "./sectionPager/helpers";

/**
 * Configuration options for useSectionPager hook.
 *
 * @property mainRef - Ref to the scroll container element (should be `<main>` with fixed height and vertical scrolling)
 */
interface UseSectionPagerOptions {
  mainRef: RefObject<HTMLElement | null>;
}

/**
 * React hook that implements a complete scroll paging system for single-page apps.
 *
 * Provides smooth section-to-section transitions via wheel, touch, and keyboard input.
 * Automatically detects device capability and uses custom smooth scroll (1400ms easeInOutCubic) on strong hardware,
 * or native smooth scroll on mid-tier/constrained devices.
 *
 * **Setup requirements:**
 * 1. Attach ref to a `<main>` element with fixed `height` (e.g., `h-screen`) and vertical scrolling (`overflow-y-auto`)
 * 2. Mark pageable sections with `className="snap-section"`
 * 3. Mark hero section with `id="about"`; intro lock is active while hero has `data-no-swipe-page="true"`
 *
 * **Features:**
 * - **Adaptive paging**: Custom animation on strong devices, native smooth on constrained
 * - **Multi-input support**: Wheel (desktop), touch (mobile/trackpad), keyboard (arrow/page/space)
 * - **Hero intro lock**: Prevents scrolling during initial cinematic sequence
 * - **Touch gesture management**: Active state tracking prevents duplicate paging
 * - **Nested scrollable awareness**: Respects overflow containers and text inputs
 * - **Full cleanup**: Event listener removal and animation frame cancellation on unmount
 *
 * **Input behavior:**
 * - **Wheel**: 12px threshold, blocked by Ctrl+scroll and hero lock, skipped on nested scrollables
 * - **Touch**: 40px threshold, gesture state lock prevents touchmove+touchend duplication
 * - **Keyboard**: Arrow/Page/Space keys, respects interactive elements (input, textarea, contenteditable)
 *
 * @param options - Configuration object with mainRef
 *
 * @example
 * const Home = () => {
 *   const mainRef = useRef<HTMLElement>(null);
 *   useSectionPager({ mainRef });
 *   return (
 *     <main ref={mainRef} className="h-screen overflow-y-auto">
 *       <section className="snap-section h-screen">Hero</section>
 *       <section className="snap-section h-screen">DevOps</section>
 *       <section className="snap-section h-screen">GameDev</section>
 *     </main>
 *   );
 * };
 */
export const useSectionPager = ({ mainRef }: UseSectionPagerOptions) => {
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    let pagingTimeoutId: number | null = null;
    let pagingRafId: number | null = null;
    let restoreSnapRafId: number | null = null;
    let isPaging = false;

    let sections: HTMLElement[] = [];
    let heroSection: HTMLElement | null = null;

    const touchState = {
      touchStartY: 0,
      touchStartTarget: null as EventTarget | null,
      hasHandledTouchGesture: false,
    };

    const setSnapEnabled = (enabled: boolean) => {
      const scroller = mainRef.current;
      if (!scroller) return;

      if (!enabled) {
        scroller.style.scrollSnapType = "none";
        scroller.style.scrollBehavior = "auto";
        return;
      }

      scroller.style.scrollSnapType = "";
      scroller.style.scrollBehavior = "";
    };

    const refreshSections = () => {
      sections = Array.from(main.querySelectorAll<HTMLElement>(".snap-section"));
      heroSection = main.querySelector<HTMLElement>("#about");
    };

    refreshSections();

    const getCurrentIndex = () => {
      return getClosestSectionIndex(main, sections);
    };

    const releasePagingLock = (delayMs = 700) => {
      if (pagingTimeoutId !== null) {
        window.clearTimeout(pagingTimeoutId);
      }

      pagingTimeoutId = window.setTimeout(() => {
        isPaging = false;
      }, delayMs);
    };

    const animateScrollTo = (targetTop: number) => {
      const scroller = mainRef.current;
      if (!scroller) return;

      if (pagingRafId !== null) {
        window.cancelAnimationFrame(pagingRafId);
      }
      if (restoreSnapRafId !== null) {
        window.cancelAnimationFrame(restoreSnapRafId);
      }

      setSnapEnabled(false);

      const startTop = scroller.scrollTop;
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const clampedTargetTop = Math.min(Math.max(targetTop, 0), maxTop);
      const distance = clampedTargetTop - startTop;

      if (Math.abs(distance) < 1) {
        scroller.scrollTop = clampedTargetTop;
        setSnapEnabled(true);
        releasePagingLock(0);
        return;
      }

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / PAGE_SCROLL_DURATION_MS, 1);
        const eased = easeInOutCubic(progress);
        scroller.scrollTop = startTop + distance * eased;

        if (progress < 1) {
          pagingRafId = window.requestAnimationFrame(step);
          return;
        }

        pagingRafId = null;

        restoreSnapRafId = window.requestAnimationFrame(() => {
          setSnapEnabled(true);
          restoreSnapRafId = null;
        });
        releasePagingLock(0);
      };

      pagingRafId = window.requestAnimationFrame(step);
    };

    const pageTo = (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= sections.length || isPaging) return;

      isPaging = true;
      const section = sections[nextIndex];
      const scroller = mainRef.current;
      if (!section || !scroller) {
        releasePagingLock();
        return;
      }

      const useNativeSmoothPaging = isMidTierOrConstrainedDevice();

      if (useNativeSmoothPaging) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        releasePagingLock(PAGE_SCROLL_LOCK_MS);
        return;
      }

      const targetTop = getTargetScrollTop(section, scroller);

      animateScrollTo(targetTop);
    };

    const pageByDelta = (delta: number) => {
      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;

      pageTo(currentIndex + delta);
    };

    const isHeroIntroScrollLocked = () => {
      const heroLocked = heroSection?.dataset.noSwipePage === "true";
      if (!heroLocked) return false;

      return true;
    };

    const handlers = createSectionPagerHandlers({
      isHeroIntroScrollLocked,
      canPageFromTarget: (target, deltaY) => canPageFromTarget(main, target, deltaY),
      pageByDelta,
      touchState,
    });

    main.addEventListener("wheel", handlers.onWheel, { passive: false });
    main.addEventListener("touchstart", handlers.onTouchStart, { passive: true });
    main.addEventListener("touchmove", handlers.onTouchMove, { passive: false });
    main.addEventListener("touchend", handlers.onTouchEnd, { passive: true });
    main.addEventListener("touchcancel", handlers.onTouchCancel, { passive: true });
    window.addEventListener("resize", refreshSections);
    window.addEventListener("keydown", handlers.onKeyDown);

    return () => {
      main.removeEventListener("wheel", handlers.onWheel);
      main.removeEventListener("touchstart", handlers.onTouchStart);
      main.removeEventListener("touchmove", handlers.onTouchMove);
      main.removeEventListener("touchend", handlers.onTouchEnd);
      main.removeEventListener("touchcancel", handlers.onTouchCancel);
      window.removeEventListener("resize", refreshSections);
      window.removeEventListener("keydown", handlers.onKeyDown);

      if (pagingTimeoutId !== null) {
        window.clearTimeout(pagingTimeoutId);
      }
      if (pagingRafId !== null) {
        window.cancelAnimationFrame(pagingRafId);
      }
      if (restoreSnapRafId !== null) {
        window.cancelAnimationFrame(restoreSnapRafId);
      }

      setSnapEnabled(true);
    };
  }, [mainRef]);
};
