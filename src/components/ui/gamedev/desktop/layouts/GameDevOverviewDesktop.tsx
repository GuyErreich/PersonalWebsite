/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Film, Layers, Sparkles } from "lucide-react";
import { playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevGallery } from "../../common/gallery/GameDevGallery";
import { useGameDevOverviewTabs } from "../../common/hooks/useGameDevOverviewTabs";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevVfxShowcasePanel } from "../../common/panels/GameDevVfxShowcasePanel";

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
  const {
    activeTab,
    directionRef,
    handleTabListKeyDown,
    projectsPanelId,
    projectsTabId,
    showreelPanelId,
    showreelTabId,
    switchTab,
    tabPulse,
    vfxPanelId,
    vfxTabId,
  } = useGameDevOverviewTabs({ idScope: "desktop" });

  return (
    <div className="gamedev-overview-desktop-tabs-stack">
      <div
        className="gamedev-desktop-overview-tabs"
        role="tablist"
        aria-label="GameDev overview"
        onKeyDown={handleTabListKeyDown}
      >
        <motion.button
          id={showreelTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "showreel"}
          aria-controls={showreelPanelId}
          tabIndex={activeTab === "showreel" ? 0 : -1}
          {...tabPulse("showreel")}
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
          tabIndex={activeTab === "projects" ? 0 : -1}
          {...tabPulse("projects")}
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
          tabIndex={activeTab === "vfx" ? 0 : -1}
          {...tabPulse("vfx")}
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
              className="h-full"
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
              className="h-full"
            >
              <div className="gamedev-panel-frame">
                <GameDevPanelShell
                  eyebrow="Featured Gallery"
                  title="Selected Work"
                  clipScroll
                  rightAction={
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {featuredItems.length > 0 ? (
                        <p className="gamedev-panel-meta">{featuredItems.length} items</p>
                      ) : null}
                      <GameDevPanelButton
                        variant="primary"
                        hoverX={3}
                        onClick={onViewAll}
                        icon={<ArrowRight className="h-4 w-4" />}
                      >
                        View All Projects
                      </GameDevPanelButton>
                    </div>
                  }
                >
                  <GameDevGallery
                    items={featuredItems}
                    iconMap={iconMap}
                    isLoading={isLoading}
                    denseCards
                  />
                </GameDevPanelShell>
              </div>
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
              className="h-full"
            >
              <div className="gamedev-vfx-showcase">
                <GameDevVfxShowcasePanel vfxItems={vfxItems} isLoading={isVfxLoading} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
