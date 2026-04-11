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
import { SectionEdge } from "./ui/SectionEdge";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";
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
        className="snap-section section-screen w-full bg-gray-900/80"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <MemoizedGamingIconsBackground id="gamedev-particles" />
        </div>
        <div
          className="absolute inset-x-0 top-0 h-64 z-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, #111827 0%, rgba(17,24,39,0.85) 22%, rgba(56,189,248,0.06) 60%, rgba(99,102,241,0.04) 80%, transparent 100%)",
          }}
        />
        <div className="section-bottom-fade" />
        <motion.div
          style={motionStyle}
          className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
        >
          <div className="grid h-full w-full grid-cols-1 items-center gap-6 py-20 md:gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-10 lg:py-24">
            <div className="flex min-h-0 flex-col justify-center gap-6 lg:gap-8">
              <div className="max-w-2xl text-center lg:text-left">
                <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
                  Game Development
                </p>
                <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
                  Showreel And Prototypes In One View
                </h2>
                <p className="text-base text-gray-300 md:text-lg lg:text-xl">
                  A tighter cinematic view of the work: the reel on one side, featured prototypes on
                  the other, without forcing an extra pager stop.
                </p>
              </div>
              <ShowreelVideo url={showreelUrl} className="max-w-none" />
            </div>

            <div className="flex min-h-0 flex-col justify-center rounded-[2rem] border border-cyan-500/15 bg-[#08101b]/72 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-5 lg:h-auto lg:p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-emerald-300/80">
                    Featured Gallery
                  </p>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    Projects & Prototypes
                  </h3>
                </div>
                <p className="hidden text-right text-xs uppercase tracking-[0.18em] text-gray-400 sm:block">
                  {galleryItems.length || 0} items
                </p>
              </div>
              <p className="mb-5 max-w-xl text-sm text-gray-400 sm:text-base">
                On mobile this becomes a compact swipe rail. On larger screens it locks into a
                two-column preview grid beside the reel.
              </p>
              <GameDevGallery
                items={galleryItems}
                iconMap={iconMap}
                isLoading={isLoading}
                compact
              />
            </div>
          </div>
        </motion.div>
        <SectionEdge variant="circuit" fillColor="#030712" height={160} className="z-20" />
      </section>
    </SectionEntranceOverlay>
  );
};
