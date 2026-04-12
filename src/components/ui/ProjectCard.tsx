/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";

import type { ReactNode } from "react";
import { useContext, useRef } from "react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { GitHubIcon } from "./BrandIcons";
import { SectionRevealContext } from "./sectionRevealContext";

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  link: string;
  icon: ReactNode;
  index: number;
  compact?: boolean;
}

export const ProjectCard = ({
  title,
  description,
  tags,
  link,
  icon,
  index,
  compact = false,
}: ProjectCardProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={
        isRevealed && isInView
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }
      }
      transition={{ duration: 0.6, delay: isRevealed ? 0.3 + index * 0.1 : 0 }}
      whileHover={{ y: -10 }}
      className={`bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors group flex flex-col h-full shadow-lg hover:shadow-blue-500/20 ${
        compact ? "p-4" : "p-8"
      }`}
    >
      <div className={`flex items-start justify-between ${compact ? "mb-3" : "mb-6"}`}>
        <div className={`bg-gray-900 rounded-lg ${compact ? "p-2" : "p-3"}`}>{icon}</div>
        <motion.a
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={playHoverSound}
          onClick={playClickSound}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${title} on GitHub`}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <GitHubIcon className={compact ? "w-5 h-5" : "w-6 h-6"} />
        </motion.a>
      </div>

      <h3
        className={`font-bold text-white group-hover:text-blue-400 transition-colors ${compact ? "text-lg mb-1" : "text-2xl mb-3"}`}
      >
        {title}
      </h3>

      <p className={`text-gray-400 flex-grow ${compact ? "text-sm mb-3 line-clamp-3" : "mb-6"}`}>
        {description}
      </p>

      <div className={`flex flex-wrap mt-auto ${compact ? "gap-1 pt-2" : "gap-2 pt-4"}`}>
        {tags.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className={`font-medium bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20 ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-sm"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};
