/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useScrollReveal } from "../../../../hooks/useScrollReveal";
import { SectionHeader } from "./SectionHeader";

interface HeroMediaSectionProps {
  id: string;
  title: string;
  description?: string;
  /** Extra classes applied to the outer <section> — use to override bg-gray-900 from .section-hero */
  sectionClassName?: string;
  children: ReactNode;
}

export const HeroMediaSection = ({
  id,
  title,
  description,
  sectionClassName = "",
  children,
}: HeroMediaSectionProps) => {
  const { ref, motionStyle } = useScrollReveal();

  return (
    <section
      id={id}
      ref={ref}
      className={`section-hero snap-section w-full relative z-10 ${sectionClassName}`}
    >
      <motion.div
        style={motionStyle}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-0 flex flex-col items-center justify-center h-full"
      >
        <SectionHeader title={title} description={description} />
        {children}
      </motion.div>
    </section>
  );
};
