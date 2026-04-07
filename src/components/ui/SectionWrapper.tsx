import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

interface SectionWrapperProps {
  id: string;
  className?: string;
  children: ReactNode;
  background?: ReactNode;
}

export const SectionWrapper = ({
  id,
  className = "py-12 md:py-16 bg-gray-900",
  children,
  background,
}: SectionWrapperProps) => {
  const { ref, motionStyle } = useScrollReveal();

  return (
    <section id={id} ref={ref} className={`overflow-hidden relative ${className}`}>
      {background && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">{background}</div>
      )}
      {/* Top fade — echoes GameDev emerald trailing into the DevOps world */}
      <div
        className="absolute inset-x-0 top-0 h-64 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #030712 0%, rgba(3,7,18,0.85) 22%, rgba(16,185,129,0.06) 60%, rgba(6,182,212,0.05) 80%, transparent 100%)",
        }}
      />
      {/* DevOps → Footer: smooth gradient dissolve into footer bg */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, #030712 100%)",
        }}
      />
      <motion.div
        style={motionStyle}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
      >
        {children}
      </motion.div>
    </section>
  );
};
