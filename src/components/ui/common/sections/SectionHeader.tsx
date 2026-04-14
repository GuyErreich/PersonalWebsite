/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import { useContext, useRef } from "react";
import { SectionRevealContext } from "./sectionRevealContext";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export const SectionHeader = ({
  title,
  description,
  className = "mb-16",
  compact = false,
}: SectionHeaderProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isRevealed && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={`text-center ${className}`}
    >
      <h2
        className={`font-extrabold text-white mb-4 ${compact ? "text-2xl" : "text-3xl md:text-4xl"}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`text-gray-400 max-w-3xl mx-auto ${compact ? "text-base" : "text-xl"}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
};
