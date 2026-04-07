import { motion, useInView } from "framer-motion";
import { useContext, useRef } from "react";
import { SectionRevealContext } from "./sectionRevealContext";

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export const SectionHeader = ({ title, description }: SectionHeaderProps) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isRevealed && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="text-center mb-16"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{title}</h2>
      {description && <p className="text-xl text-gray-400 max-w-3xl mx-auto">{description}</p>}
    </motion.div>
  );
};
