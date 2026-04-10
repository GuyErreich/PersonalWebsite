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
import { GameDevGallery } from "./ui/GameDevGallery";
import { HeroMediaSection } from "./ui/HeroMediaSection";
import { SectionEdge } from "./ui/SectionEdge";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";
import { SectionHeader } from "./ui/SectionHeader";
import { ShowreelVideo } from "./ui/ShowreelVideo";

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

const iconMap: Record<string, React.ElementType> = {
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

export interface GameDevItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string;
  icon_name?: string;
  github_url?: string;
  live_url?: string;
}

export const GameDevSection = () => {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GameDevItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { ref: galleryRef, motionStyle: galleryMotionStyle } = useScrollReveal();

  useEffect(() => {
    const fetchData = async () => {
      const { data: showreelData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "showreel_url")
        .single();

      if (showreelData) setShowreelUrl(showreelData.value);

      const { data: items } = await supabase
        .from("gamedev_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (items) setGalleryItems(items as GameDevItem[]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="relative w-full">
      {/* Hero → GameDev shaped edge — nebula horizon rising from above */}
      {/* <SectionEdge variant="terrain" fillColor="#111827" inverted height={72} waveAmp={2.0} waveFreq={1.7} stormAmp={1.5} stormFreq={6} className="z-[55]" /> */}
      {/* Shared ambient background — spans the full height of both sub-sections */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MemoizedGamingIconsBackground id="gamedev-particles" />
      </div>
      {/* Top fade — echoes Hero space blue bleeding into the gaming world */}
      <div
        className="absolute inset-x-0 top-0 h-64 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #111827 0%, rgba(17,24,39,0.85) 22%, rgba(56,189,248,0.06) 60%, rgba(99,102,241,0.04) 80%, transparent 100%)",
        }}
      />
      {/* GameDev → DevOps shaped edge — circuit board PCB trace silhouette */}
      <SectionEdge variant="circuit" fillColor="#030712" height={160} className="z-20" />

      {/* ── Section 1: Full-screen hero with title + showreel ── */}
      <SectionEntranceOverlay theme="gamedev">
        <HeroMediaSection
          id="gamedev"
          title="Game Development & Design"
          description="Showcasing my journey in game development, from mechanics design to full-fledged prototypes."
          sectionClassName="bg-gray-900/80"
        >
          <ShowreelVideo url={showreelUrl} />
        </HeroMediaSection>
      </SectionEntranceOverlay>
      {/* ── Section 2: Full-screen gallery ── */}
      <section
        id="gamedev-gallery"
        ref={galleryRef}
        className="min-h-[100svh] flex flex-col items-center justify-center relative z-10 py-20 bg-gray-900/80"
      >
        <motion.div
          style={galleryMotionStyle}
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-12"
        >
          <SectionHeader
            title="Projects & Prototypes"
            description="A curated look at the games and interactive experiences I've built."
          />
          <GameDevGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} />
        </motion.div>
      </section>
    </div>
  );
};
