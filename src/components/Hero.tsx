
import { useEffect } from 'react';
import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ThreeHeroBackground } from './backgrounds/three/ThreeHeroBackground';

const TypewriterText = ({ text, delay, duration, className = "" }: { text: string, delay: number, duration: number, className?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => text.slice(0, latest));

  useEffect(() => {
    const controls = animate(count, text.length, {
      type: "tween",
      delay: delay,
      duration: duration,
      ease: "linear",
    });
    return controls.stop;
  }, [count, text.length, delay, duration]);

  return <motion.span className={className}>{displayText}</motion.span>;
};

const devOpsBadges = ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Helm'];
const gameDevBadges = ['Unity', 'C#', 'Game Feel', 'Shaders', 'Godot'];

export const Hero = () => {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden bg-gray-900">
      
      {/* Three.js Background */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ThreeHeroBackground />
        </Canvas>
      </div>
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/40 via-transparent to-gray-900 pointer-events-none"></div>

      {/* Padding wrapper — outside the border so padding doesn't affect border thickness */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-0" style={{ perspective: '1200px' }}>
      {/* Animated Gradient Border Wrapper */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.01, 
          z: -2000, 
          y: 200, 
          rotateX: 45, 
          filter: 'brightness(5) blur(20px)' 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          z: 0, 
          y: 0, 
          rotateX: 0, 
          filter: 'brightness(1) blur(0px)' 
        }}
        transition={{ 
          delay: 12.5, 
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 15,
          mass: 0.8
        }}
        className="relative rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.3)] transform-gpu"
      >
        {/* Spinner is 200% size centered on card so rotation axis = card center, clipped by overflow-hidden */}
        <div
          className="absolute animate-spin-slow pointer-events-none"
          style={{
            inset: '-50%',
            background: 'conic-gradient(from 0deg, #3b82f6, #7c3aed, #10b981, #f59e0b, #3b82f6)',
            opacity: 0.75,
          }}
        />
        {/* Soft bloom copy behind for glow depth */}
        <div
          className="absolute animate-spin-slow pointer-events-none blur-lg"
          style={{
            inset: '-50%',
            background: 'conic-gradient(from 0deg, #3b82f6, #7c3aed, #10b981, #f59e0b, #3b82f6)',
            opacity: 0.2,
          }}
        />

        {/* Card body — starts fully opaque so the card exists visually during warp-in. The text inside will spawn later. */}
        <motion.div
          initial={{ y: 0, scale: 1 }}
          animate={{
            y: [0, 20, -6, 0],
            scale: [1, 0.94, 1.02, 1],
          }}
          transition={{
            duration: 0.6,
            delay: 13.2, // Matches exactly with the text impact
            times: [0, 0.08, 0.4, 1], // Sudden punch, bounce back, settle
            ease: "easeInOut"
          }}
          style={{ transformOrigin: 'bottom center', width: 'calc(100% - 3px)', height: 'calc(100% - 3px)' }}
          className="relative m-[1.5px] bg-gray-900/95 backdrop-blur-xl rounded-2xl p-8 shadow-inner text-center"
        >
          {/* Big Title Tagline - Stamps in first */}
          <motion.h1
            initial={{ opacity: 0, scale: 5, y: -180, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.2, delay: 13.0, ease: 'easeIn' }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 relative"
            style={{ transformOrigin: 'center center' }}
          >
            {/* Base static gradient text */}
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #7c3aed)',
              }}
            >
              Engineer. Developer. Creator.
            </span>

            {/* White sweep / shine layer perfectly overlaid */}
            <motion.span
              initial={{ backgroundPosition: '200% 0', opacity: 0 }}
              animate={{ backgroundPosition: '-50% 0', opacity: 1 }}
              transition={{ 
                backgroundPosition: { duration: 1.2, delay: 13.9, ease: 'easeInOut' },
                opacity: { duration: 0.1, delay: 13.9 } 
              }}
              className="absolute inset-0 block text-transparent bg-clip-text pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(120deg, transparent 40%, rgba(255, 255, 255, 1) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
              aria-hidden="true"
            >
              Engineer. Developer. Creator.
            </motion.span>
          </motion.h1>

          {/* Name with cursor blink - fades in after shine */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 14.1 }}
            className="text-3xl md:text-4xl text-gray-300 font-medium mb-6"
          >
            Hello, I'm <span className="text-white font-bold">Guy Erreich</span>
          </motion.h2>

          {/* Paragraph — staggered typing style line by line, sharing a jumping cursor */}
          <div className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 font-medium mb-8 leading-relaxed flex flex-col items-center">
            <div className="w-full text-center">
              <p className="mb-2 relative inline-flex items-center min-h-[30px]">
                <TypewriterText text="DevOps engineer specializing in AWS, Kubernetes, Terraform, and CI/CD automation." delay={14.7} duration={1.8} />
                {/* Cursor jumps to line 1 */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={{ 
                      opacity: [0, 1, 0, 1, 0], // Blink while typing
                   }}
                   transition={{ delay: 14.7, duration: 1.8, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
              <br />
              <p className="mb-2 relative inline-flex items-center min-h-[30px]">
                <TypewriterText text="Focused on reliability and clean architecture—by day." delay={16.7} duration={1.2} />
                {/* Cursor jumps to line 2 */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={{ 
                      opacity: [0, 1, 0, 1, 0], 
                   }}
                   transition={{ delay: 16.7, duration: 1.2, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
              <br />
              <p className="relative inline-flex items-center min-h-[30px]">
                <TypewriterText text="Game developer passionate about game feel and player experience—by passion." delay={18.1} duration={1.6} />
                {/* Cursor jumps to line 3 and stays blinking forever */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={{ 
                      opacity: [0, 1, 0], 
                   }}
                   transition={{ delay: 18.1, duration: 0.8, repeat: Infinity, repeatType: "loop", ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
            </div>
          </div>

          {/* Tech Badge Rows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 19.8 }}
            className="mb-8 space-y-3"
          >
            {/* DevOps badges — blue toned */}
            <div className="flex flex-wrap justify-center gap-2">
              {devOpsBadges.map((badge, i) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 19.8 + i * 0.07 }}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-colors cursor-default"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
            {/* GameDev badges — emerald/purple toned */}
            <div className="flex flex-wrap justify-center gap-2">
              {gameDevBadges.map((badge, i) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 20.3 + i * 0.07 }}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-default"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 20.7 }}
            className="flex justify-center space-x-6"
          >
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <span className="sr-only">GitHub</span>
              <Github className="w-7 h-7" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors bg-gray-800 hover:bg-[#0077b5]/20 p-3 rounded-full"
              style={{ ['--hover-color' as string]: '#0077b5' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0077b5')}
              onMouseLeave={e => (e.currentTarget.style.color = '')}
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="w-7 h-7" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              href="mailto:hello@example.com"
              className="text-gray-400 hover:text-emerald-400 transition-colors bg-gray-800 hover:bg-emerald-500/10 p-3 rounded-full"
            >
              <span className="sr-only">Email</span>
              <Mail className="w-7 h-7" />
            </motion.a>
          </motion.div>
        </motion.div>
      </motion.div>
      </div>{/* end padding wrapper */}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 21.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10 hidden md:block"
      >
        <a href="#gamedev" className="text-gray-400 hover:text-white bg-gray-800/80 rounded-full p-2 block">
          <ChevronDown className="w-6 h-6" />
        </a>
      </motion.div>
    </section>
  );
};
