/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Mail, Terminal } from "lucide-react";
import { useRef, useState } from "react";
import { useMediaQuery } from "../hooks/responsive/useMediaQuery";
import { playClickSound, playHoverSound } from "../lib/sound/interactionSounds";
import { GitHubIcon, LinkedInIcon } from "./ui/common/icons/BrandIcons";

type FooterTab = "overview" | "contact";

const TAB_ORDER: FooterTab[] = ["overview", "contact"];

const mobilePanelVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
};

export const Footer = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeTab, setActiveTab] = useState<FooterTab>("overview");
  const directionRef = useRef(1);

  const handleBackToTop = () => {
    playClickSound();

    if (typeof window !== "undefined") {
      const pager = document.getElementById("home-pager");
      if (pager) {
        pager.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const switchTab = (nextTab: FooterTab) => {
    if (nextTab === activeTab) return;

    const from = TAB_ORDER.indexOf(activeTab);
    const to = TAB_ORDER.indexOf(nextTab);
    directionRef.current = to > from ? 1 : -1;
    playClickSound();
    setActiveTab(nextTab);
  };

  return (
    <footer className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden border-t border-cyan-900/30 bg-[#040811]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,15,28,0.72),rgba(4,8,17,0.96))]" />
      </div>

      <div className="section-frame">
        <div className="relative mx-auto flex h-full w-full max-w-6xl items-start md:items-center px-5 pb-4 sm:px-8 sm:pb-6">
          {isMobile ? (
            <div className="mt-2 flex h-[88%] w-full flex-col rounded-3xl border border-cyan-400/20 bg-[#081325]/70 p-4 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-xl">
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => switchTab("overview")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                    activeTab === "overview" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300"
                  }`}
                >
                  Overview
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => switchTab("contact")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                    activeTab === "contact" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300"
                  }`}
                >
                  Contact
                </motion.button>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                <motion.div
                  key={activeTab}
                  custom={directionRef.current}
                  variants={mobilePanelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  {activeTab === "overview" ? (
                    <div className="flex h-full flex-col justify-between gap-4">
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                          <Terminal className="h-4 w-4" />
                          Game Dev + DevOps
                        </div>

                        <h2 className="text-2xl font-black leading-tight text-white">
                          A developer at heart — building games, tools, and cloud systems that
                          matter.
                        </h2>

                        <p className="text-sm text-slate-300">
                          Code is my native language. I build gameplay systems, developer tooling,
                          and infrastructure pipelines — always starting from the craft itself.
                        </p>

                        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                            Unity + C#
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                            AWS + Kubernetes
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                            Terraform + CI/CD
                          </span>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onMouseEnter={playHoverSound}
                        onClick={handleBackToTop}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                      >
                        Back To Top
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col justify-between gap-4">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">
                            Contact
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            Developer at heart — game dev is my roots. I care about gameplay feel,
                            intuitive flow, and the code behind the experience. Also open to DevOps
                            and automation work.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <motion.a
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.94 }}
                            onMouseEnter={playHoverSound}
                            onClick={playClickSound}
                            href="https://github.com/GuyErreich"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 text-slate-200 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-white/20 hover:from-white/16 hover:to-white/8 hover:text-white"
                          >
                            <span className="sr-only">GitHub</span>
                            <GitHubIcon className="h-5 w-5" />
                            <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">
                              GitHub
                            </span>
                          </motion.a>

                          <motion.a
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.94 }}
                            onMouseEnter={playHoverSound}
                            onClick={playClickSound}
                            href="https://www.linkedin.com/in/guy-erreich"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-[#0077b5]/30 bg-gradient-to-b from-[#0077b5]/20 to-[#0077b5]/8 text-slate-100 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-[#0077b5]/50 hover:from-[#0077b5]/28 hover:to-[#0077b5]/14 hover:text-white"
                          >
                            <span className="sr-only">LinkedIn</span>
                            <LinkedInIcon className="h-5 w-5" />
                            <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">
                              LinkedIn
                            </span>
                          </motion.a>

                          <motion.a
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.94 }}
                            onMouseEnter={playHoverSound}
                            onClick={playClickSound}
                            href="mailto:gerreich.dev@gmail.com"
                            className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/18 to-emerald-500/8 text-emerald-100 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-emerald-400/45 hover:from-emerald-500/24 hover:to-emerald-500/12 hover:text-emerald-50"
                          >
                            <span className="sr-only">Email</span>
                            <Mail className="h-5 w-5" />
                            <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">
                              Email
                            </span>
                          </motion.a>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/10 bg-white/6 px-2.5 py-2 text-center">
                            <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">
                              Timezone
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-white">GMT+3</p>
                          </div>
                          <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-2 text-center">
                            <p className="text-[9px] uppercase tracking-[0.14em] text-cyan-200/80">
                              Response
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-cyan-100">~24h</p>
                          </div>
                        </div>
                      </div>

                      <motion.a
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onMouseEnter={playHoverSound}
                        onClick={playClickSound}
                        href="mailto:gerreich.dev@gmail.com"
                        className="inline-flex w-full items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/22"
                      >
                        Start a Conversation
                      </motion.a>
                    </div>
                  )}
                </motion.div>
              </div>

              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
                © {new Date().getFullYear()} Guy Erreich
              </p>
            </div>
          ) : (
            <div className="grid w-full gap-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-14 lg:gap-20">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  <Terminal className="h-4 w-4" />
                  Game Dev + DevOps
                </div>

                <h2 className="text-balance text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
                  A developer at heart — building games, tools, and cloud systems that matter.
                </h2>

                <p className="max-w-2xl text-base text-slate-300 sm:text-lg lg:text-xl">
                  Code is my native language. I build gameplay systems, developer tooling, and
                  infrastructure pipelines — always starting from the craft itself.
                </p>

                <div className="flex flex-wrap gap-2.5 text-xs uppercase tracking-[0.14em] text-slate-300">
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                    Unity + C#
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                    AWS + Kubernetes
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                    Terraform + CI/CD
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
                className="rounded-3xl border border-cyan-400/20 bg-[#081325]/75 p-5 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-xl sm:p-6 lg:p-8"
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">
                  Contact
                </p>

                <p className="mb-6 text-sm leading-relaxed text-slate-300 lg:text-base">
                  Developer at heart — game development is my roots. I care about gameplay feel,
                  intuitive flow, and the code behind the experience. Open to both game dev and
                  DevOps roles.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onMouseEnter={playHoverSound}
                    onClick={playClickSound}
                    href="https://github.com/GuyErreich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 text-slate-200 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-white/20 hover:from-white/16 hover:to-white/8 hover:text-white"
                  >
                    <GitHubIcon className="h-6 w-6" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      GitHub
                    </span>
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onMouseEnter={playHoverSound}
                    onClick={playClickSound}
                    href="https://www.linkedin.com/in/guy-erreich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#0077b5]/30 bg-gradient-to-b from-[#0077b5]/20 to-[#0077b5]/8 text-slate-100 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-[#0077b5]/50 hover:from-[#0077b5]/28 hover:to-[#0077b5]/14 hover:text-white"
                  >
                    <LinkedInIcon className="h-6 w-6" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      LinkedIn
                    </span>
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onMouseEnter={playHoverSound}
                    onClick={playClickSound}
                    href="mailto:gerreich.dev@gmail.com"
                    className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/18 to-emerald-500/8 text-emerald-100 shadow-[0_10px_24px_rgba(2,6,23,0.35)] transition-colors hover:border-emerald-400/45 hover:from-emerald-500/24 hover:to-emerald-500/12 hover:text-emerald-50"
                  >
                    <Mail className="h-6 w-6" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Email
                    </span>
                  </motion.a>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      Timezone
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">GMT+3</p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/80">
                      Response
                    </p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">~24h</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                  <motion.a
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onMouseEnter={playHoverSound}
                    onClick={playClickSound}
                    href="mailto:gerreich.dev@gmail.com"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/22"
                  >
                    Start a Conversation
                  </motion.a>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onMouseEnter={playHoverSound}
                    onClick={handleBackToTop}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                  >
                    Back To Top
                  </motion.button>
                </div>

                <p className="mt-5 text-center text-xs uppercase tracking-[0.16em] text-slate-400 sm:text-left">
                  © {new Date().getFullYear()} Guy Erreich
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
