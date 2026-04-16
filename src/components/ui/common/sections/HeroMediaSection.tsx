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
    <section id={id} ref={ref} className={`section-hero snap-section ${sectionClassName}`}>
      <div className="section-frame">
        <motion.div
          style={motionStyle}
          className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
        >
          <SectionHeader title={title} description={description} />
          {children}
        </motion.div>
      </div>
    </section>
  );
};
