/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Film, Layers, Sparkles } from "lucide-react";
import { useId, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevGallery } from "../../common/gallery/GameDevGallery";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevVfxShowcasePanel } from "../../common/panels/GameDevVfxShowcasePanel";

type Tab = "showreel" | "projects" | "vfx";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * 40 }),
};

export const GameDevOverviewDesktop = ({
  showreelUrl,
  featuredItems,
  vfxItems,
  isLoading,
  isVfxLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("showreel");
  const tabPanelIdBase = useId();
  const showreelTabId = `${tabPanelIdBase}-desktop-tab-showreel`;
  const projectsTabId = `${tabPanelIdBase}-desktop-tab-projects`;
  const vfxTabId = `${tabPanelIdBase}-desktop-tab-vfx`;
  const showreelPanelId = `${tabPanelIdBase}-desktop-panel-showreel`;
  const projectsPanelId = `${tabPanelIdBase}-desktop-panel-projects`;
  const vfxPanelId = `${tabPanelIdBase}-desktop-panel-vfx`;
  const directionRef = useRef(1);
  const TAB_ORDER: Tab[] = ["showreel", "projects", "vfx"];

  const switchTab = (tab: Tab) => {
    const from = TAB_ORDER.indexOf(activeTab);
    const to = TAB_ORDER.indexOf(tab);
    directionRef.current = to > from ? 1 : -1;
    playClickSound();
    setActiveTab(tab);
  };

  return (
    <div className="gamedev-overview-desktop-tabs-stack">
      <div className="gamedev-desktop-overview-tabs" role="tablist" aria-label="GameDev overview">
        <motion.button
          id={showreelTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "showreel"}
          aria-controls={showreelPanelId}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("showreel")}
          className={`gamedev-desktop-overview-tab${activeTab === "showreel" ? " gamedev-desktop-overview-tab--active" : ""}`}
        >
          <Film className="h-4 w-4" />
          Showreel
        </motion.button>

        <motion.button
          id={projectsTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "projects"}
          aria-controls={projectsPanelId}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("projects")}
          className={`gamedev-desktop-overview-tab${activeTab === "projects" ? " gamedev-desktop-overview-tab--active" : ""}`}
        >
          <Layers className="h-4 w-4" />
          Selected Work
        </motion.button>

        <motion.button
          id={vfxTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "vfx"}
          aria-controls={vfxPanelId}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("vfx")}
          className={`gamedev-desktop-overview-tab${activeTab === "vfx" ? " gamedev-desktop-overview-tab--active" : ""}`}
        >
          <Sparkles className="h-4 w-4" />
          VFX
        </motion.button>
      </div>

      <div className="gamedev-desktop-overview-content">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {activeTab === "showreel" ? (
            <motion.div
              key="showreel"
              role="tabpanel"
              id={showreelPanelId}
              aria-labelledby={showreelTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <GameDevShowreelPanel showreelUrl={showreelUrl} />
            </motion.div>
          ) : activeTab === "projects" ? (
            <motion.div
              key="projects"
              role="tabpanel"
              id={projectsPanelId}
              aria-labelledby={projectsTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <GameDevPanelShell
                eyebrow="Featured Gallery"
                title="Selected Work"
                clipScroll
                description="A curated set of projects and prototypes highlighting gameplay, technical systems, and visual polish."
                rightAction={
                  featuredItems.length > 0 ? (
                    <p className="gamedev-panel-meta">{featuredItems.length} items</p>
                  ) : undefined
                }
                footer={
                  <GameDevPanelButton
                    variant="primary"
                    hoverX={3}
                    onClick={onViewAll}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    View All Projects
                  </GameDevPanelButton>
                }
              >
                <GameDevGallery
                  items={featuredItems}
                  iconMap={iconMap}
                  isLoading={isLoading}
                  compact
                  maxCompactItems={3}
                />
              </GameDevPanelShell>
            </motion.div>
          ) : (
            <motion.div
              key="vfx"
              role="tabpanel"
              id={vfxPanelId}
              aria-labelledby={vfxTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <GameDevPanelShell
                eyebrow="Effects Reel"
                title="Visual Effects"
                clipScroll
                description="Shader work, particles, and real-time FX captured from recent projects."
                rightAction={
                  vfxItems.length > 0 ? (
                    <p className="gamedev-panel-meta">{vfxItems.length} effects</p>
                  ) : undefined
                }
              >
                <GameDevVfxShowcasePanel vfxItems={vfxItems} isLoading={isVfxLoading} />
              </GameDevPanelShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
