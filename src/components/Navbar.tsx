/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  X as CloseIcon,
  Code2,
  Gamepad2,
  Mail,
  Menu as MenuIcon,
  Terminal,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/responsive/useMediaQuery";
import { useScrollContainer } from "../lib/ScrollContainerContext";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../lib/sound/interactionSounds";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const previousOverflow = useRef("");
  const [scrolled, setScrolled] = useState(false);
  const [mouseNearTop, setMouseNearTop] = useState(false);
  const scrollContainer = useScrollContainer();

  const navigateToSection = (href: string) => {
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Auto-hide on scroll; reveal when mouse returns to top strip
  useEffect(() => {
    const container = scrollContainer?.current;
    const onScroll = () => setScrolled((container?.scrollTop ?? window.scrollY) > 80);
    const onMouseMove = (e: MouseEvent) => setMouseNearTop(e.clientY < 48);
    if (container) {
      container.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      if (container) {
        container.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [scrollContainer]);

  const isMobile = useMediaQuery("(max-width: 767px)");
  const navVisible = isMobile || !scrolled || mouseNearTop;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow.current;
    }
    return () => {
      document.body.style.overflow = previousOverflow.current;
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: "#about", label: "About", icon: User, color: "text-cyan-400" },
    {
      href: "#gamedev",
      label: "Game Dev",
      icon: Gamepad2,
      color: "text-purple-400",
    },
    {
      href: "#devops",
      label: "DevOps & Automation",
      icon: Code2,
      color: "text-green-400",
    },
    { href: "#contact", label: "Contact", icon: Mail, color: "text-cyan-300" },
  ];

  const drawerVariants: import("framer-motion").Variants = {
    hidden: {
      x: "100%",
      opacity: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const linkVariants: import("framer-motion").Variants = {
    hidden: { x: 50, opacity: 0, rotateX: -30 },
    visible: {
      x: 0,
      opacity: 1,
      rotateX: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 20 },
    },
  };

  return (
    <>
      <motion.nav
        animate={{ y: navVisible ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.8 }}
        className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-md z-[100] border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Terminal className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white">DevPortfolio</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={playHoverSound}
                      onClick={(event) => {
                        playClickSound();
                        const targetSelector = link.href.startsWith("#") ? link.href : "";
                        const target = targetSelector
                          ? document.querySelector<HTMLElement>(targetSelector)
                          : null;

                        if (!target) {
                          return;
                        }

                        event.preventDefault();
                        navigateToSection(link.href);

                        if (window.location.hash !== link.href) {
                          window.history.pushState(null, "", link.href);
                        }
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-xl group hover:bg-gray-800/50 border border-transparent hover:border-cyan-900/50 transition-colors"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gray-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-gray-800 group-hover:border-cyan-500/30 transition-all duration-300">
                        <Icon
                          className={`w-4 h-4 ${link.color} drop-shadow-[0_0_5px_currentColor] opacity-80 group-hover:opacity-100`}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open menu"
                className="p-2 rounded-xl text-gray-300 hover:text-white bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all"
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playMenuOpenSound();
                  setMobileOpen(true);
                }}
              >
                <MenuIcon className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Advanced Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-[110] pointer-events-auto">
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playMenuCloseSound();
                setMobileOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full h-full cursor-default"
            />

            {/* Side Drawer */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ perspective: 1000 }}
              className="absolute top-0 right-0 w-3/4 max-w-[300px] h-screen bg-[#0a0f1a]/90 backdrop-blur-2xl border-l border-cyan-500/30 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col p-6 overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute top-[20%] right-[-50%] w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-[20%] left-[-20%] w-48 h-48 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    Menu
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close menu"
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playMenuCloseSound();
                    setMobileOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/50 hover:bg-gray-700 border border-transparent hover:border-gray-600 transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]"
                >
                  <CloseIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Links */}
              <div className="flex flex-col space-y-4 relative z-10">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      variants={linkVariants}
                      whileHover={{ scale: 1.02, x: 8 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={playHoverSound}
                      onClick={(event) => {
                        playClickSound();
                        playMenuCloseSound();
                        const targetSelector = link.href.startsWith("#") ? link.href : "";
                        const target = targetSelector
                          ? document.querySelector<HTMLElement>(targetSelector)
                          : null;

                        if (!target) {
                          return;
                        }

                        event.preventDefault();
                        navigateToSection(link.href);

                        if (window.location.hash !== link.href) {
                          window.history.pushState(null, "", link.href);
                        }

                        setMobileOpen(false);
                      }}
                      className="flex items-center space-x-4 group p-3 rounded-xl hover:bg-gray-800/50 border border-transparent hover:border-cyan-900/50 transition-colors"
                    >
                      <div className="flex-shrink-0 p-3 rounded-lg bg-gray-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-gray-800 group-hover:border-cyan-500/30 transition-all duration-300">
                        <Icon
                          className={`w-5 h-5 ${link.color} drop-shadow-[0_0_5px_currentColor] opacity-80 group-hover:opacity-100`}
                        />
                      </div>
                      <span className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </motion.a>
                  );
                })}
              </div>

              {/* Footer / System Status */}
              <div className="mt-auto relative z-10 border-t border-gray-800/50 pt-4 px-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-xs text-gray-400 font-mono tracking-widest">
                    SYSTEM_ONLINE
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
