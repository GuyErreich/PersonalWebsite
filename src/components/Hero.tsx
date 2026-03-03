
import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ThreeHeroBackground } from './backgrounds/three/ThreeHeroBackground';

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
      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-0">
      {/* Animated Gradient Border Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 9.2, ease: 'easeOut' }}
        className="relative rounded-2xl overflow-hidden"
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

        {/* Card body — m-[1.5px] exposes exactly 1.5px of the gradient beneath as the border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 9.45, ease: 'easeOut' }}
          className="relative m-[1.5px] bg-gray-900 backdrop-blur-md rounded-2xl p-8 shadow-2xl text-center"
        >
          {/* Name with cursor blink */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 9.6 }}
            className="text-3xl md:text-4xl text-gray-300 font-medium mb-4"
          >
            Hello, I'm <span className="text-white font-bold">Guy Erreich</span>
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 10.1, duration: 0.5, repeat: 3, repeatType: 'mirror' }}
              className="inline-block ml-0.5 w-[2px] h-[1em] bg-white align-middle"
            />
          </motion.h2>

          {/* Shimmer tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 9.7 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            <span
              className="block text-transparent bg-clip-text shimmer-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #7c3aed, #3b82f6)',
              }}
            >
              Engineer. Developer. Creator.
            </span>
          </motion.h1>

          {/* Paragraph — staggered line by line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 9.8 }}
            className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 font-medium mb-8 leading-relaxed"
          >
            {[
              'DevOps engineer specializing in AWS, Kubernetes, Terraform, and CI/CD automation.',
              'Focused on reliability and clean architecture\u2014by day.',
              'Game developer passionate about game feel and player experience\u2014by passion.',
            ].map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 9.8 + i * 0.2 }}
              >
                {line}
              </motion.p>
            ))}
          </motion.div>

          {/* Tech Badge Rows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 10.0 }}
            className="mb-8 space-y-3"
          >
            {/* DevOps badges — blue toned */}
            <div className="flex flex-wrap justify-center gap-2">
              {devOpsBadges.map((badge, i) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 10.0 + i * 0.07 }}
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
                  transition={{ duration: 0.3, delay: 10.45 + i * 0.07 }}
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
            transition={{ duration: 0.5, delay: 10.2 }}
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
        transition={{ delay: 11.0, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10 hidden md:block"
      >
        <a href="#gamedev" className="text-gray-400 hover:text-white bg-gray-800/80 rounded-full p-2 block">
          <ChevronDown className="w-6 h-6" />
        </a>
      </motion.div>
    </section>
  );
};
