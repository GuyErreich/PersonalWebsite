import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';

interface ShowreelVideoProps {
  url: string | null;
}

export const ShowreelVideo = ({ url }: ShowreelVideoProps) => {
  const hasCookie = !!Cookies.get('hero_visited');

  return (
    <motion.div 
      initial={hasCookie ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: hasCookie ? 0 : 0.8 }}
      className="mb-20 w-full max-w-5xl mx-auto"
    >
      <div className="flex items-center space-x-2 mb-6">
        <Play className="w-6 h-6 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Showreel</h3>
      </div>
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-gray-700 shadow-2xl group flex items-center justify-center bg-gray-900">
        {url ? (
            <video 
              src={url} 
              controls 
              className="absolute inset-0 w-full h-full object-cover"
            />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
            <div className="text-center z-10">
              <Play className="w-16 h-16 text-white/50 mx-auto mb-4 group-hover:text-white transition-colors cursor-pointer" />
              <p className="text-gray-400">Showreel not set</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};