/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Film, Layers } from "lucide-react";
import { useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevHiveGallery } from "../gallery/GameDevHiveGallery";

type Tab = "showreel" | "projects";

// Variant functions: AnimatePresence forwards `custom` (current direction)
// to the exiting child at exit time, so the correct direction is always used.
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * 40 }),
};

export const GameDevOverviewMobileShort = ({
  showreelUrl,
  galleryItems,
  isLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("showreel");
  const [hasInteracted, setHasInteracted] = useState(false);
  const directionRef = useRef(1); // 1 = forward (showreel→projects), -1 = backward
  const TAB_ORDER: Tab[] = ["showreel", "projects"];

  const markInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const switchTab = (tab: Tab) => {
    const from = TAB_ORDER.indexOf(activeTab);
    const to = TAB_ORDER.indexOf(tab);
    directionRef.current = to > from ? 1 : -1;
    markInteracted();
    playClickSound();
    setActiveTab(tab);
  };

  // Repeating cyan pulse on the "projects" tab until user interacts with tabs.
  // When done, explicitly animate boxShadow to "none" so framer-motion clears the lingering glow.
  const pulseAnimation = hasInteracted
    ? { boxShadow: "0 0 0px rgba(6,182,212,0)" }
    : {
        boxShadow: [
          "0 0 0px rgba(6,182,212,0)",
          "0 0 14px rgba(6,182,212,0.75)",
          "0 0 0px rgba(6,182,212,0)",
        ],
      };
  const pulseTransition = hasInteracted
    ? { duration: 0.3 }
    : { duration: 1.4, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" as const };

  return (
    <div className="gamedev-overview-mobile-short-stack">
      {/* Tab strip */}
      <div className="gamedev-mobile-short-tabs" role="tablist">
        <motion.button
          type="button"
          role="tab"
          aria-selected={activeTab === "showreel"}
          aria-controls="tab-panel-showreel"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("showreel")}
          className={`gamedev-mobile-short-tab-btn${activeTab === "showreel" ? " gamedev-mobile-short-tab-btn--active" : ""}`}
        >
          <Film className="h-3.5 w-3.5" />
          Showreel
        </motion.button>

        <motion.button
          type="button"
          role="tab"
          aria-selected={activeTab === "projects"}
          aria-controls="tab-panel-projects"
          animate={pulseAnimation}
          transition={pulseTransition}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("projects")}
          className={`gamedev-mobile-short-tab-btn${activeTab === "projects" ? " gamedev-mobile-short-tab-btn--active" : ""}`}
        >
          <Layers className="h-3.5 w-3.5" />
          Selected Work
        </motion.button>
      </div>

      {/* Tab panels */}
      <div className="gamedev-mobile-short-content">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {activeTab === "showreel" ? (
            <motion.div
              key="showreel"
              role="tabpanel"
              id="tab-panel-showreel"
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="gamedev-mobile-short-panel flex items-center justify-center pb-[30%]"
            >
              <GameDevShowreelPanel showreelUrl={showreelUrl} />
            </motion.div>
          ) : (
            <motion.div
              key="projects"
              role="tabpanel"
              id="tab-panel-projects"
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="gamedev-mobile-short-panel"
            >
              <GameDevPanelShell
                eyebrow="Featured Gallery"
                title="Selected Work"
                description="A curated set of projects and prototypes highlighting gameplay, technical systems, and visual polish."
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
                <GameDevHiveGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} />
              </GameDevPanelShell>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
