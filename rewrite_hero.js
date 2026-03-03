const fs = require('fs');

let code = fs.readFileSync('temp_old_hero.tsx', 'utf-8');

// 1. imports
code = code.replace(
  "import { useEffect } from 'react';",
  "import React, { useState, useEffect } from 'react';"
);
code = code.replace(
  "import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react';",
  "import { Github, Linkedin, Mail, ChevronDown, RotateCcw } from 'lucide-react';\nimport Cookies from 'js-cookie';\nimport { ReverseHyperspace } from './backgrounds/three/hero/ReverseHyperspace';"
);
code = code.replace(
  "import { motion, useMotionValue, useTransform, animate } from 'framer-motion';",
  "import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';"
);

// 2. logic insertion
code = code.replace(
  "export const Hero = () => {\n  return (",
  `export const Hero = () => {
  const [hasCookie] = useState(() => !!Cookies.get('hero_visited'));
  const [skipIntro, setSkipIntro] = useState(hasCookie);
  const [isRewinding, setIsRewinding] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    Cookies.set('hero_visited', 'true', { expires: 7 });
  }, []);

  const handleReplay = () => {
    setIsRewinding(true);
    setSkipIntro(false);
    
    // Rewind lasts 2 seconds, then resets
    setTimeout(() => {
      setIsRewinding(false);
      setAnimationKey(prev => prev + 1);
    }, 2000);
  };

  const getDelay = (baseDelay) => Math.max(0, skipIntro ? 0 : baseDelay);

  return (`
);

// 3. background rewrite
const oldBg = `{/* Three.js Background */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ThreeHeroBackground />
        </Canvas>
      </div>`;
const newBg = `{/* Background Layer */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <AnimatePresence mode="wait">
          {isRewinding ? (
            <motion.div
              key="rewind"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full w-full"
            >
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ReverseHyperspace />
              </Canvas>
              <motion.div 
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1] }} 
                transition={{ duration: 2, times: [0, 0.9, 1] }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={\`bg-\${animationKey}\`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: skipIntro ? 1 : 0 }}
              className="absolute inset-0 h-full w-full"
            >
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ThreeHeroBackground skipIntro={skipIntro} />
              </Canvas>
            </motion.div>
          )}
        </AnimatePresence>
      </div>`;
code = code.replace(oldBg, newBg);

// 4. Wrapping Main card
const oldPaddingWrapper = `<div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-0" style={{ perspective: '1200px' }}>`;
const newPaddingWrapper = `<AnimatePresence>
        {!isRewinding && (
          <motion.div
            key={\`content-\${animationKey}\`}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-0" style={{ perspective: '1200px' }}
          >`;
code = code.replace(oldPaddingWrapper, newPaddingWrapper);

const oldPaddingEnd = `</div>{/* end padding wrapper */}`;
const newPaddingEnd = `</motion.div>
        )}
      </AnimatePresence>
      {/* end padding wrapper */}`;
code = code.replace(oldPaddingEnd, newPaddingEnd);

// 5. Wrap chevron
const oldChevron = `<motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 21.5, duration: 1 }}`;
const newChevron = `<AnimatePresence>
        {!isRewinding && (
          <motion.div 
            key={\`chevron-\${animationKey}\`}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: getDelay(21.5), duration: 1 }}`;
code = code.replace(oldChevron, newChevron);

const oldChevronEnd = `</a>
      </motion.div>`;
const newChevronEnd = `</a>
          </motion.div>
        )}
      </AnimatePresence>`;
code = code.replace(oldChevronEnd, newChevronEnd);

// 6. Injection of Replay Button
const innerCardTarget = `className="relative m-[1.5px] bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 shadow-inner text-center"
        >`;
const innerCardReplace = `className="relative m-[1.5px] bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 shadow-inner text-center"
        >
          {/* Replay Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: getDelay(13.5) }} /* fade in with text */
            whileHover={{ scale: 1.1, rotate: -15 }}
            whileTap={{ scale: 0.8, rotate: 180 }}
            onClick={handleReplay}
            className="absolute top-4 right-4 p-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full shadow-lg hover:shadow-pink-500/50 transition-all z-20 group"
            title="Replay Animation"
          >
            <RotateCcw className="w-5 h-5 group-hover:animate-spin-fast" />
          </motion.button>
`;
code = code.replace(innerCardTarget, innerCardReplace);

// 7. Inject getDelay calls automatically
// Need to match delay: Number OR delay={Number} 
const typeWriterRegexComponent = /delay=\{([\d\.]+)\}/g;
code = code.replace(typeWriterRegexComponent, (match, p1) => {
  return \`delay={getDelay(\${p1})}\`;
});

// Wait, TypewriterText is declared outside but also used inside.
// In the declaration: const TypewriterText = ({ ..., delay, ...
// We don't want to replace inside the interface!
// The interface does not use `delay: X.X` or `delay={X}` so it's fine.
// But we need to replace `delay: 13.2` style props!
const simpleDelayRegex = /delay:\s*([\d\.]+)(\s*(?:,|\]|\})))/g;
code = code.replace(simpleDelayRegex, (match, p1, p2) => {
  // make sure not to replace if it is already wrapped in getDelay
  return \`delay: getDelay(\${p1})\${p2}\`
});

// Let's also wrap the object version:
// transition={{ backgroundPosition: { duration: 1.2, delay: 13.9, ease: 'easeInOut' },
// Because simpleDelayRegex handles trailing brackets it might catch this.

// Write it to file
fs.writeFileSync('src/components/Hero.tsx', code);
