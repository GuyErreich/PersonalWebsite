/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useInView } from "framer-motion";
import type { ReactNode } from "react";
import { useScrollReveal } from "../../../../hooks/useScrollReveal";
import { useScrollContainer } from "../../../../lib/ScrollContainerContext";

interface SectionWrapperProps {
  id: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  background?: ReactNode;
  bottomFadeClassName?: string;
  backgroundInViewOnly?: boolean;
}

export const SectionWrapper = ({
  id,
  className = "bg-gray-900",
  innerClassName = "justify-center",
  children,
  background,
  bottomFadeClassName = "",
  backgroundInViewOnly = false,
}: SectionWrapperProps) => {
  const { ref, motionStyle } = useScrollReveal();
  const container = useScrollContainer();
  const shouldRenderBackground = useInView(ref, {
    root: container ?? undefined,
    margin: "30% 0px 30% 0px",
  });

  return (
    <section id={id} ref={ref} className={`snap-section overflow-hidden relative ${className}`}>
      {background && (!backgroundInViewOnly || shouldRenderBackground) && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">{background}</div>
      )}
      {/* Top fade — echoes GameDev emerald trailing into the DevOps world */}
      <div className="section-top-fade" />
      {/* DevOps → Footer: smooth gradient dissolve into footer bg */}
      <div className={`section-bottom-fade ${bottomFadeClassName}`.trim()} />
      {/* Visible-area frame: starts below fixed navbar, full remaining height. */}
      <div className="section-frame z-10">
        <motion.div
          style={motionStyle}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col ${innerClassName}`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};
