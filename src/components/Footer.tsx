/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Terminal } from "lucide-react";
import { playClickSound, playHoverSound } from "../lib/sound/interactionSounds";

export const Footer = () => {
  return (
    <footer className="bg-gray-950 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <Terminal className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">DevPortfolio</span>
          </div>

          <div className="flex space-x-4 mb-6 md:mb-0">
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <span className="sr-only">GitHub</span>
              <Github className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-[#0077b5]/20 p-3 rounded-full"
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              href="mailto:hello@example.com"
              className="text-gray-400 hover:text-emerald-400 transition-colors bg-gray-800 hover:bg-emerald-500/10 p-3 rounded-full"
            >
              <span className="sr-only">Email</span>
              <Mail className="w-6 h-6" />
            </motion.a>
          </div>

          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} DevPortfolio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
