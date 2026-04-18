/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useRef } from "react";
import { DevOpsSection } from "../components/DevOpsSection";
import { Footer } from "../components/Footer";
import { GameDevSection } from "../components/GameDevSection";
import { Hero } from "../components/Hero";
import { Navbar } from "../components/Navbar";
import { FloatingContactDock } from "../components/ui/common/controls/FloatingContactDock";
import { useSectionPager } from "../hooks/pagination/useSectionPager";
import { ScrollContainerContext } from "../lib/ScrollContainerContext";

/**
 * Home page — main landing page of the portfolio.
 *
 * Renders a full-viewport scrollable page with multiple sections (Hero, DevOps, GameDev, Footer).
 * Uses the useSectionPager hook to provide smooth section-to-section paging via wheel, touch, and keyboard input.
 * Exposes the scroll container via ScrollContainerContext for child components that need scroll state.
 *
 * Features:
 * - Adaptive paging (custom rAF on capable devices, native smooth on constrained)
 * - Multi-input navigation (wheel, touch, keyboard)
 * - Hero intro lock (prevents scrolling during cinematic intro)
 * - Floating contact dock on desktop
 * - Full accessibility support
 *
 * @example
 * // Renders in App.tsx as the main route:
 * <Route path="/" element={<Home />} />
 */
export const Home = () => {
  const mainRef = useRef<HTMLElement>(null);
  useSectionPager({ mainRef });

  return (
    <ScrollContainerContext.Provider value={mainRef}>
      <div className="h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
        <Navbar />

        <div className="hidden md:block">
          <FloatingContactDock />
        </div>

        <main
          id="home-pager"
          ref={mainRef}
          className="viewport-pager viewport-scroll-hidden h-screen overflow-y-auto overflow-x-hidden"
        >
          <Hero />

          <GameDevSection />

          <DevOpsSection />

          <section id="contact" className="snap-section">
            <Footer />
          </section>
        </main>
      </div>
    </ScrollContainerContext.Provider>
  );
};
