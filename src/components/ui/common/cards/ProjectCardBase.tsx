/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { useContext, useRef } from "react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { GitHubIcon } from "../icons/BrandIcons";
import { SectionRevealContext } from "../sections/sectionRevealContext";

interface ProjectCardTheme {
  containerClassName: string;
  iconShellClassName: string;
  titleClassName: string;
  tagClassName: string;
}

interface ProjectCardBaseProps {
  title: string;
  description: string;
  tags?: string[];
  link?: string | null;
  icon: ReactNode;
  index: number;
  compact?: boolean;
  thumbnailUrl?: string;
  theme: ProjectCardTheme;
}

export const ProjectCardBase = ({
  title,
  description,
  tags,
  link,
  icon,
  index,
  compact = false,
  thumbnailUrl,
  theme,
}: ProjectCardBaseProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasThumbnail = !!thumbnailUrl;

  return (
    <div ref={ref} className="h-full min-h-0 overflow-visible pt-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isRevealed && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.3, delay: isRevealed ? 0.1 + index * 0.07 : 0 }}
        whileHover={{ y: -6, transition: { duration: 0.12, ease: "easeOut" } }}
        className={theme.containerClassName}
      >
        {hasThumbnail && (
          <div className={`${compact ? "h-20 xl:h-24" : "h-32 xl:h-36"} shrink-0 overflow-hidden`}>
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className={`flex min-h-0 flex-col ${compact ? "gap-2 p-3" : "gap-2.5 p-5"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className={`${theme.iconShellClassName} ${compact ? "p-2" : "p-2.5"}`}>{icon}</div>

            {link && (
              <motion.a
                whileHover={{ scale: 1.15, rotate: 8 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${title} on GitHub`}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <GitHubIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
              </motion.a>
            )}
          </div>

          <h3 className={`${theme.titleClassName} ${compact ? "text-sm" : "text-xl"}`}>{title}</h3>

          <p
            className={`min-h-0 flex-grow leading-relaxed text-gray-400 ${
              compact ? "line-clamp-2 text-xs" : "line-clamp-4 text-base"
            }`}
          >
            {description}
          </p>

          {tags && tags.length > 0 && (
            <div className={`mt-auto flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
              {tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className={`${theme.tagClassName} ${
                    compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
