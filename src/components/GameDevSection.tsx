/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import {
  Code,
  Cpu,
  Database,
  Gamepad2,
  Globe,
  Monitor,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Wrench,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { supabase } from "../lib/supabase";
import { GamingIconsBackground } from "./backgrounds/tsparticles/GamingIconsBackground";
import { GameDevAllProjectsPanel } from "./ui/gamedev/GameDevAllProjectsPanel";
import { GameDevOverviewPanel } from "./ui/gamedev/GameDevOverviewPanel";
import type { GameDevIconMap, GameDevItem } from "./ui/gamedev/types";
import { SectionEdge } from "./ui/SectionEdge";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

const iconMap: GameDevIconMap = {
  gamepad: Gamepad2,
  code: Code,
  server: Server,
  globe: Globe,
  cpu: Cpu,
  database: Database,
  rocket: Rocket,
  shield: Shield,
  terminal: Terminal,
  wrench: Wrench,
  smartphone: Smartphone,
  monitor: Monitor,
};

export const GameDevSection = () => {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GameDevItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllProjectsView, setShowAllProjectsView] = useState(false);
  const { ref: sectionRef, motionStyle } = useScrollReveal();

  useEffect(() => {
    void (async () => {
      try {
        const { data: showreelData, error: showreelError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "showreel_url")
          .single();

        if (showreelError) {
          console.warn(showreelError.message);
        } else if (showreelData) {
          setShowreelUrl(showreelData.value);
        }

        const { data: items, error: itemsError } = await supabase
          .from("gamedev_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (itemsError) {
          console.warn(itemsError.message);
        } else if (items) {
          setGalleryItems(items as GameDevItem[]);
        }
      } catch (e) {
        console.warn(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <SectionEntranceOverlay theme="gamedev">
      <section
        id="gamedev"
        ref={sectionRef}
        className="snap-section section-screen w-full !h-[104svh] !min-h-[104svh] !pt-10 !pb-8 md:!pt-8 md:!pb-6 bg-gray-900/80"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <MemoizedGamingIconsBackground id="gamedev-particles" />
        </div>
        <div
          className="absolute inset-x-0 top-0 h-64 z-[5] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #111827 0%, rgba(17,24,39,0.85) 22%, rgba(56,189,248,0.06) 60%, rgba(99,102,241,0.04) 80%, transparent 100%)",
          }}
        />
        <div className="section-bottom-fade !z-[6]" />
        <motion.div
          style={motionStyle}
          className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-start px-4 sm:px-6 lg:px-8"
        >
          <div className="relative h-full w-full overflow-hidden">
            <motion.div
              animate={{ x: showAllProjectsView ? "-50%" : "0%" }}
              transition={{ type: "spring", stiffness: 150, damping: 24 }}
              className="flex h-full w-[200%]"
            >
              <div className="h-full w-1/2">
                <GameDevOverviewPanel
                  showreelUrl={showreelUrl}
                  galleryItems={galleryItems}
                  isLoading={isLoading}
                  iconMap={iconMap}
                  onViewAll={() => setShowAllProjectsView(true)}
                />
              </div>

              <div className="h-full w-1/2">
                <GameDevAllProjectsPanel
                  galleryItems={galleryItems}
                  isLoading={isLoading}
                  iconMap={iconMap}
                  onBack={() => setShowAllProjectsView(false)}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
        <SectionEdge variant="circuit" fillColor="#111827" height={130} className="z-[8]" />
      </section>
    </SectionEntranceOverlay>
  );
};
