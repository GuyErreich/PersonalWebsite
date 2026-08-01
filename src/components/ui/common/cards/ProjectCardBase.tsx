/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { ComingSoonBadge } from "../badges/ComingSoonBadge";
import { GitHubIcon } from "../icons/BrandIcons";
import { SectionRevealContext } from "../sections/sectionRevealContext";

const MotionLink = motion(Link);

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
  detailsLink?: string;
  statusBadge?: string | null;
  icon: ReactNode;
  index: number;
  compact?: boolean;
  contentSized?: boolean;
  openOnDoubleClick?: boolean;
  thumbnailUrl?: string;
  skipRevealGate?: boolean;
  theme: ProjectCardTheme;
}

export const ProjectCardBase = ({
  title,
  description,
  tags,
  link,
  detailsLink,
  statusBadge,
  icon,
  index,
  compact = false,
  contentSized = false,
  openOnDoubleClick = false,
  thumbnailUrl,
  skipRevealGate = false,
  theme,
}: ProjectCardBaseProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const navigate = useNavigate();
  const hasThumbnail = !!thumbnailUrl;
  const useDoubleClickOpen = openOnDoubleClick && !!detailsLink;

  const openProjectPage = useCallback(() => {
    if (!detailsLink) return;

    playClickSound();
    navigate(detailsLink);
  }, [detailsLink, navigate]);

  const handleDoubleClick = () => {
    if (!useDoubleClickOpen) return;

    openProjectPage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!useDoubleClickOpen) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectPage();
    }
  };

  const wrapperClassName = contentSized
    ? "h-auto min-h-0 overflow-visible pt-2"
    : "h-full min-h-0 overflow-visible pt-2";

  const githubLinkClassName = "text-gray-400 transition-colors hover:text-white";

  const githubLinkOverlayClassName = compact
    ? `absolute top-3 right-3 z-30 ${githubLinkClassName}`
    : `absolute top-5 right-5 z-30 ${githubLinkClassName}`;

  const renderGitHubLink = (className: string) => {
    if (!link) return null;

    return (
      <motion.a
        whileHover={{ scale: 1.15, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={playHoverSound}
        onClick={(event) => {
          event.stopPropagation();
          playClickSound();
        }}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${title} on GitHub`}
        className={className}
      >
        <GitHubIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </motion.a>
    );
  };

  const cardBody = (showGitHubInHeader: boolean) => (
    <>
      {hasThumbnail && (
        <div
          className={`relative z-20 ${compact ? "h-20 xl:h-24" : "h-32 xl:h-36"} shrink-0 overflow-hidden`}
        >
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div
        className={`relative z-20 flex min-h-0 flex-col ${compact ? "gap-2 p-3" : "gap-2.5 p-5"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={`${theme.iconShellClassName} ${compact ? "p-2" : "p-2.5"}`}>{icon}</div>

          <div className="flex items-center gap-2">
            {detailsLink && !useDoubleClickOpen && (
              <MotionLink
                to={detailsLink}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
                aria-label={`Open ${title} project page`}
                className="relative z-30 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-100"
              >
                Open
              </MotionLink>
            )}

            {showGitHubInHeader && renderGitHubLink(`relative z-30 ${githubLinkClassName}`)}
          </div>
        </div>

        <h3 className={`${theme.titleClassName} ${compact ? "text-sm" : "text-xl"}`}>
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{title}</span>
            {statusBadge ? <ComingSoonBadge>{statusBadge}</ComingSoonBadge> : null}
          </span>
        </h3>

        <p
          className={`min-h-0 leading-relaxed text-gray-400 ${
            contentSized ? "flex-none" : "flex-grow"
          } ${compact ? "line-clamp-2 text-xs" : contentSized ? "text-base" : "line-clamp-4 text-base"}`}
        >
          {description}
        </p>

        {tags && tags.length > 0 && (
          <div
            className={`${contentSized ? "" : "mt-auto"} flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}
          >
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
    </>
  );

  const motionProps = {
    initial: skipRevealGate ? false : { opacity: 0, y: 16 },
    animate:
      skipRevealGate || (isRevealed && isInView) ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    transition: { duration: 0.3, delay: skipRevealGate ? 0 : isRevealed ? 0.1 + index * 0.07 : 0 },
  };

  return (
    <div ref={ref} className={wrapperClassName}>
      {useDoubleClickOpen ? (
        <motion.div
          {...motionProps}
          whileHover={{ y: -6, transition: { duration: 0.12, ease: "easeOut" } }}
          className={`relative ${theme.containerClassName}`}
        >
          <motion.div
            role="button"
            tabIndex={0}
            title="Double-click to open project"
            aria-label={`${title}. Double-click or press Enter to open project page.`}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={playHoverSound}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="relative h-full w-full cursor-pointer"
          >
            {cardBody(false)}
          </motion.div>
          {renderGitHubLink(githubLinkOverlayClassName)}
        </motion.div>
      ) : (
        <motion.div
          {...motionProps}
          whileHover={{ y: -6, transition: { duration: 0.12, ease: "easeOut" } }}
          className={`relative ${theme.containerClassName}`}
        >
          {cardBody(true)}
        </motion.div>
      )}
    </div>
  );
};
