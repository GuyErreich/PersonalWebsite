/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from "react";
import { DevOpsSection } from "../components/DevOpsSection";
import { GameDevSection } from "../components/GameDevSection";
import { Hero } from "../components/Hero";
import { Navbar } from "../components/Navbar";
import { FloatingContactDock } from "../components/ui/FloatingContactDock";
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

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const distance = Math.abs(section.offsetTop - main.scrollTop);
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
      sections[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
      releasePagingLock();
    };

    const pageByDelta = (delta: number) => {
      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;
      pageTo(currentIndex + delta);
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      pageByDelta(event.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) < 40) return;
      pageByDelta(deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
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
        </main>
      </div>
    </ScrollContainerContext.Provider>
  );
};
