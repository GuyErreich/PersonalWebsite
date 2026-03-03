
import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ThreeHeroBackground } from './backgrounds/three/ThreeHeroBackground';

export const Hero = () => {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden bg-gray-900">
      
      {/* Node Network Background - Wrapped carefully to prevent re-renders on state change */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ThreeHeroBackground />
        </Canvas>
      </div>
      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/40 via-transparent to-gray-900 pointer-events-none"></div>

      {/* Hero Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 8.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 bg-gray-900/60 p-8 rounded-2xl backdrop-blur-sm mt-12 md:mt-0 shadow-2xl border border-gray-800/50"
      >
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 9.0 }}
          className="text-3xl md:text-4xl text-gray-300 font-medium mb-4"
        >
          Hello, I'm <span className="text-white font-bold">Guy Erreich</span>
        </motion.h2>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 9.0 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
        >
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 transition-opacity duration-500">
            Engineer. Developer. Creator.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 9.2 }}
          className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 font-medium mb-12 leading-relaxed"
        >
          DevOps engineer specializing in AWS, Kubernetes, Terraform, and CI/CD automation.<br/>
          Focused on reliability and clean architecture—by day.<br/>
          Game developer passionate about game feel and player experience—by passion.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 9.4 }}
          className="flex justify-center space-x-6 mb-8 mt-12"
        >
          <motion.a whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }} href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-3 rounded-full">
            <span className="sr-only">GitHub</span>
            <Github className="w-7 h-7" />
          </motion.a>
          <motion.a whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.9 }} href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-3 rounded-full">
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="w-7 h-7" />
          </motion.a>
          <motion.a whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }} href="mailto:hello@example.com" className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-3 rounded-full">
            <span className="sr-only">Email</span>
            <Mail className="w-7 h-7" />
          </motion.a>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 10.1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10 hidden md:block"
      >
        <a href="#gamedev" className="text-gray-400 hover:text-white bg-gray-800/80 rounded-full p-2 block">
          <ChevronDown className="w-6 h-6" />
        </a>
      </motion.div>
    </section>
  );
};
