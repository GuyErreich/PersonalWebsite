/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from "react";
import { DevOpsSection } from "../components/DevOpsSection";
import { Footer } from "../components/Footer";
import { GameDevSection } from "../components/GameDevSection";
import { Hero } from "../components/Hero";
import { Navbar } from "../components/Navbar";
import { FloatingContactDock } from "../components/ui/common/controls/FloatingContactDock";
import { ScrollContainerContext } from "../lib/ScrollContainerContext";

export const Home = () => {
  const mainRef = useRef<HTMLElement>(null);
  const isPagingRef = useRef(false);
  const pagingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const getSections = () => Array.from(main.querySelectorAll<HTMLElement>(".snap-section"));

    const getCurrentIndex = () => {
      const sections = getSections();
      if (sections.length === 0) return -1;

      // Use getBoundingClientRect so the distance is correct for sections nested
      // inside positioned ancestors (e.g. SectionEntranceOverlay's <div class="relative">).
      // offsetTop would be relative to the nearest positioned ancestor, not to main.
      const mainTop = main.getBoundingClientRect().top;

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const distance = Math.abs(section.getBoundingClientRect().top - mainTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    };

    const releasePagingLock = () => {
      if (pagingTimeoutRef.current !== null) {
        window.clearTimeout(pagingTimeoutRef.current);
      }
      pagingTimeoutRef.current = window.setTimeout(() => {
        isPagingRef.current = false;
      }, 700);
    };

    const pageTo = (nextIndex: number) => {
      const sections = getSections();
      if (nextIndex < 0 || nextIndex >= sections.length || isPagingRef.current) return;

      isPagingRef.current = true;
      const section = sections[nextIndex];
      const main = mainRef.current;
      if (!section || !main) {
        releasePagingLock();
        return;
      }
      // Find the scrollable container (main)

      // Use native smooth scroll snap
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      releasePagingLock();
    };

    const pageByDelta = (delta: number) => {
      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;
      pageTo(currentIndex + delta);
    };

    const canPageFromTarget = (target: EventTarget | null, deltaY: number) => {
      // First pass: if ANY ancestor opts out of section paging, never page —
      // regardless of whether a scrollable child is at its edge.
      let el = target as HTMLElement | null;
      while (el && el !== main) {
        if (el.hasAttribute("data-no-swipe-page")) return false;
        el = el.parentElement;
      }

      // Second pass: let an inner scrollable element consume the swipe until it
      // reaches its edge, then allow section paging.
      el = target as HTMLElement | null;
      while (el && el !== main) {
        const { overflowY } = window.getComputedStyle(el);
        if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
          const atTop = el.scrollTop === 0;
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          return deltaY < 0 ? atTop : atBottom;
        }
        el = el.parentElement;
      }

      return true;
    };

    const onWheel = (event: WheelEvent) => {
      // Ctrl+wheel is the browser zoom gesture — never intercept it.
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaY) < 12) return;
      // A child element (e.g. compact gallery) already called preventDefault() —
      // it handled the scroll internally, so don't trigger section paging.
      if (event.defaultPrevented) return;

      // Let nested scrollable panels consume wheel input until they reach an edge.
      if (!canPageFromTarget(event.target, event.deltaY)) return;

      event.preventDefault();
      pageByDelta(event.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;
    let touchStartTarget: EventTarget | null = null;

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
      touchStartTarget = event.target;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) < 40) return;
      if (!canPageFromTarget(touchStartTarget, deltaY)) return;
      pageByDelta(deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInteractive =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.isContentEditable;
      if (isInteractive) return;

      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        pageByDelta(1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        pageByDelta(-1);
      }
    };

    main.addEventListener("wheel", onWheel, { passive: false });
    main.addEventListener("touchstart", onTouchStart, { passive: true });
    main.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      main.removeEventListener("wheel", onWheel);
      main.removeEventListener("touchstart", onTouchStart);
      main.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      if (pagingTimeoutRef.current !== null) {
        window.clearTimeout(pagingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ScrollContainerContext.Provider value={mainRef}>
      <div className="h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
        <Navbar />

        <FloatingContactDock />

        <main
          id="home-pager"
          ref={mainRef}
          className="viewport-pager viewport-scroll-hidden h-screen overflow-y-auto overflow-x-hidden"
        >
          <Hero />

          <GameDevSection />

          <DevOpsSection />

          <section className="snap-section">
            <Footer />
          </section>
        </main>
      </div>
    </ScrollContainerContext.Provider>
  );
};
