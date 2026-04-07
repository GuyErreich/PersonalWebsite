/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import { Github } from "lucide-react";
import type { ReactNode } from "react";
import { useContext, useRef } from "react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { SectionRevealContext } from "./sectionRevealContext";

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  link: string;
  icon: ReactNode;
  index: number;
}

export const ProjectCard = ({ title, description, tags, link, icon, index }: ProjectCardProps) => {
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
      className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-colors group flex flex-col h-full shadow-lg hover:shadow-blue-500/20"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="p-3 bg-gray-900 rounded-lg">{icon}</div>
        <motion.a
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={playHoverSound}
          onClick={playClickSound}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Github className="w-6 h-6" />
        </motion.a>
      </div>

      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>

      <p className="text-gray-400 mb-6 flex-grow">{description}</p>

      <div className="flex flex-wrap gap-2 mt-auto pt-4">
        {tags.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className="px-3 py-1 text-sm font-medium bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};
