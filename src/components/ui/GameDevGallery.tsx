/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import { ExternalLink, Gamepad2, Image as ImageIcon } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { GitHubIcon } from "./BrandIcons";
import type { GameDevItem } from "./gamedev/common/types";
import { SectionRevealContext } from "./sectionRevealContext";

// ── Sub-components so hooks can be called per-item in mapped lists ──────────

const GalleryGridItem = ({
  item,
  index,
  isVideo,
}: {
  item: GameDevItem;
  index: number;
  isVideo: (url: string) => boolean;
}) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      key={item.id}
      initial={{ opacity: 0, y: 30 }}
      animate={isRevealed && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: isRevealed ? 0.3 + index * 0.1 : 0 }}
      className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group"
    >
      {isVideo(item.media_url) ? (
        <video
          src={item.media_url}
          poster={item.thumbnail_url}
          muted
          loop
          autoPlay
          playsInline
          className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        />
      ) : (
        <img
          src={item.media_url}
          alt={item.title}
          className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white font-medium text-sm truncate">{item.title}</p>
      </div>
    </motion.div>
  );
};

const GalleryDetailItem = ({
  item,
  index,
  iconMap,
}: {
  item: GameDevItem;
  index: number;
  iconMap: Record<string, React.ElementType>;
}) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  // Resolve icon — `iconMap` values are `React.ElementType`, cast to a concrete prop shape for JSX
  const ProjectIcon = (
    item.icon_name ? (iconMap[item.icon_name] ?? Gamepad2) : Gamepad2
  ) as React.ComponentType<{ className?: string }>;
  return (
    <motion.div
      ref={ref}
      key={item.id}
      initial={{ opacity: 0, x: 50 }}
      animate={isRevealed && isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{ duration: 0.5, delay: isRevealed ? 0.3 + index * 0.2 : 0 }}
      className="mb-12 w-full bg-gray-800/30 p-6 rounded-lg border border-gray-700"
    >
      <div className="flex items-center space-x-3 mb-4">
        <ProjectIcon className="w-8 h-8 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">{item.title}</h3>
        <div className="flex space-x-2 ml-auto">
          {item.github_url && (
            <motion.a
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              href={item.github_url}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="GitHub"
            >
              {/* GitHub mark */}
              <GitHubIcon className="w-5 h-5" />
            </motion.a>
          )}
          {item.live_url && (
            <motion.a
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              href={item.live_url}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              title="Live Preview"
            >
              <ExternalLink className="w-5 h-5" />
            </motion.a>
          )}
        </div>
      </div>
      <MarkdownRenderer content={item.description} />
    </motion.div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

interface GameDevGalleryProps {
  items: GameDevItem[];
  iconMap: Record<string, React.ElementType>;
  isLoading?: boolean;
  compact?: boolean;
  showCompactToggle?: boolean;
}

export const GameDevGallery = ({
  items,
  iconMap,
  isLoading = false,
  compact = false,
  showCompactToggle = true,
}: GameDevGalleryProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });
  const [showAllCompact, setShowAllCompact] = useState(false);
  const revealReady = compact ? true : headerInView;

  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg)$/i) != null;

  if (compact) {
    const featuredItems = items.slice(0, 4);
    const compactItems = showAllCompact ? items : featuredItems;

    return (
      <div className="w-full">
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[220px] sm:min-w-0 aspect-[3/4] lg:aspect-[2/3] bg-gray-700/40 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : compactItems.length > 0 ? (
          <>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible">
              {compactItems.map((item, index) => (
                <motion.a
                  key={item.id}
                  href={item.live_url ?? item.github_url ?? item.media_url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={playHoverSound}
                  onClick={playClickSound}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isRevealed && revealReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ duration: 0.35, delay: isRevealed ? 0.15 + index * 0.08 : 0 }}
                  className="group relative min-w-[220px] sm:min-w-0 aspect-[3/4] lg:aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-gray-800/55"
                >
                  {isVideo(item.media_url) ? (
                    <video
                      src={item.media_url}
                      poster={item.thumbnail_url}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover opacity-75 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : (
                    <img
                      src={item.thumbnail_url ?? item.media_url}
                      alt={item.title}
                      className="h-full w-full object-cover opacity-75 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-transparent p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                      <Gamepad2 className="h-3.5 w-3.5" />
                      Featured
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                  </div>
                </motion.a>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              {items.length > 4 && showCompactToggle && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setShowAllCompact((prev) => !prev);
                  }}
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200 transition-colors hover:bg-cyan-500/18"
                >
                  {showAllCompact ? "Show Featured" : "View All Projects"}
                </motion.button>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-gray-500">
            No projects added yet.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery Section */}
      <div>
        <motion.div
          ref={headerRef}
          className="flex items-center space-x-2 mb-6"
          initial={{ opacity: 0, x: -30 }}
          animate={isRevealed && revealReady ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ImageIcon className="w-6 h-6 text-emerald-400" />
          <h3 className="text-2xl font-bold text-white">Gallery</h3>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-700/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <GalleryGridItem key={item.id} item={item} index={index} isVideo={isVideo} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 border border-dashed border-gray-700 rounded-lg p-8 flex items-center justify-center h-full">
            No items added yet.
          </div>
        )}
      </div>

      {/* Details & Markdown Code Block */}
      {items.length > 0 && (
        <div className="flex flex-col items-start w-full">
          {items.map((item, index) => (
            <GalleryDetailItem key={item.id} item={item} index={index} iconMap={iconMap} />
          ))}
        </div>
      )}
    </div>
  );
};
