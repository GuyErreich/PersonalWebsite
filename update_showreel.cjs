const fs = require('fs');
const content = `import { useState, useRef } from 'react';
import { Play, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

interface ShowreelVideoProps {
  url: string | null;
}

export const ShowreelVideo = ({ url }: ShowreelVideoProps) => {
  const hasCookie = !!Cookies.get('hero_visited');
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (!url) return;
    setIsActive(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <motion.div 
      initial={hasCookie ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: hasCookie ? 0 : 0.8 }}
      className="mb-20 w-full max-w-5xl mx-auto"
    >
      <motion.div 
        layout
        className={\`relative w-full aspect-video overflow-hidden rounded-2xl border \${isActive ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-gray-700/50 shadow-2xl'} flex items-center justify-center bg-gray-900 group transition-colors duration-500\`}
        animate={{
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {url ? (
          <>
            <video 
              ref={videoRef}
              src={url} 
              controls={isActive}
              className="absolute inset-0 w-full h-full object-cover"
              onPause={() => setIsActive(false)}
              onPlay={() => setIsActive(true)}
            />
            
            {/* Interactive Overlay when not active */}
            <AnimatePresence>
              {!isActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950/60 backdrop-blur-sm cursor-pointer group-hover:bg-gray-950/40 transition-colors"
                  onClick={handlePlay}
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4"
                  >
                    <Play className="w-8 h-8 ml-2" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white tracking-widest uppercase mb-2 drop-shadow-md">Showreel</h3>
                  <p className="text-cyan-200/70 text-sm font-mono flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" /> Click to Initialise
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
            <div className="text-center z-10">
              <Play className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-gray-500 font-mono">Showreel data disconnected</p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
`;

fs.writeFileSync('src/components/ui/ShowreelVideo.tsx', content);
