import { motion } from 'framer-motion';
import Cookies from 'js-cookie';

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export const SectionHeader = ({ title, description }: SectionHeaderProps) => {
  const hasCookie = !!Cookies.get('hero_visited');

  return (
    <motion.div 
      initial={hasCookie ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: hasCookie ? 0 : 0.6 }}
      className="text-center mb-16"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{title}</h2>
      {description && (
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </motion.div>
  );
};