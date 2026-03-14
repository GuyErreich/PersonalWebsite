const fs = require('fs');
let content = fs.readFileSync('src/components/Hero.tsx', 'utf8');

// 1. Add useRef to imports
content = content.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, useRef } from 'react';"
);

// 2. Add refs and state
if (!content.includes('isMobileHovering')) {
    content = content.replace(
      "const [isMobileLaunching, setIsMobileLaunching] = useState(false);",
      "const [isMobileLaunching, setIsMobileLaunching] = useState(false);\n  const [isMobileHovering, setIsMobileHovering] = useState(false);\n  const hoverAudioRef = useRef<any>(null);"
    );
}

// 3. Replace the button Block
const startStr = '<motion.button\n                id="replay-button-phone"';
const endStr = '</motion.button>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find button");
    process.exit(1);
}

const newButton = `<motion.button
                id="replay-button-phone"
                className="relative flex items-center justify-center flex-col h-12 w-12 rounded-full bg-cyan-950/80 backdrop-blur-md border-[2px] border-b-cyan-500 border-t-cyan-300 text-cyan-50 shadow-[0_4px_15px_rgba(6,182,212,0.4)] overflow-visible group"
                onClick={() => {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioCtx) return;
                    
                    // Cleanup hover sound immediately
                    if (hoverAudioRef.current) {
                        try {
                            const { osc, gain, ctx } = hoverAudioRef.current;
                            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
                            osc.stop(ctx.currentTime + 0.1);
                        } catch(e) {}
                        hoverAudioRef.current = null;
                    }

                    const ctx = new AudioCtx();
                    
                    // Bass Kick for Launch
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(150, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.8);
                    
                    // Deep Exhaust Roar
                    const bufferSize = ctx.sampleRate * 2.0;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    const noiseFilter = ctx.createBiquadFilter();
                    noiseFilter.type = 'lowpass';
                    noiseFilter.frequency.setValueAtTime(3000, ctx.currentTime);
                    noiseFilter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);
                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
                    noiseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                    noise.connect(noiseFilter);
                    noiseFilter.connect(noiseGain);
                    noiseGain.connect(ctx.destination);
                    noise.start(ctx.currentTime);
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (e) {}
                  
                  // Trigger local launch animation, delay the overall replay and reset
                  setIsMobileLaunching(true);
                  setTimeout(() => {
                    handleReplay();
                    // Let the UI unmount or handle rewinding, then reset local state
                    setTimeout(() => setIsMobileLaunching(false), 2000);
                  }, 600);
                }}
                title="Engage Timeshift"
                onMouseEnter={() => {
                  setIsMobileHovering(true);
                  if (isMobileLaunching) return;

                  try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioCtx) return;
                    const ctx = new AudioCtx();
                    
                    // Persistent warm humming rumble
                    const osc = ctx.createOscillator();
                    const filter = ctx.createBiquadFilter();
                    const gain = ctx.createGain();
                    
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(30, ctx.currentTime);
                    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 1.0);
                    
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(200, ctx.currentTime);

                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.3);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime);
                    
                    hoverAudioRef.current = { ctx, osc, gain };
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (_e) { /* ignore */ }
                }}
                onMouseLeave={() => {
                  setIsMobileHovering(false);
                  if (hoverAudioRef.current) {
                      try {
                          const { ctx, osc, gain } = hoverAudioRef.current;
                          gain.gain.cancelScheduledValues(ctx.currentTime);
                          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
                          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                          osc.stop(ctx.currentTime + 0.3);
                      } catch(e) {}
                      hoverAudioRef.current = null;
                  }
                }}
                animate={{ 
                  y: [0, -4, 0],
                  boxShadow: ["0px 10px 20px rgba(6,182,212,0.2)", "0px 15px 30px rgba(6,182,212,0.4)", "0px 10px 20px rgba(6,182,212,0.2)"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Launch Animation Wrapper (Moves Diagonally Top-Right) */}
                <motion.div 
                  className="relative w-full h-full flex items-center justify-center z-10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  animate={isMobileLaunching ? { x: 150, y: -150, scale: 0.5, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }}
                  transition={isMobileLaunching ? { duration: 0.5, ease: "easeIn" } : { duration: 0.3 }}
                >
                  {/* Rotational Frame for Rocket and Flame */}
                  <div className="relative flex flex-col items-center justify-center rotate-45">
                    
                    {/* Rocket Icon */}
                    <Rocket className="-rotate-45 w-5 h-5 shrink-0 relative z-10 text-cyan-50 drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                    
                    {/* Engine Flame (Conditional visibility via animate prop, not tailwind hover) */}
                    <motion.div 
                      className="absolute top-[calc(50%+6px)] left-1/2 w-2 -translate-x-1/2 origin-top bg-gradient-to-b from-white via-amber-500 to-transparent blur-[1px] rounded-full z-0 pointer-events-none"
                      style={{ height: "12px" }}
                      animate={
                        isMobileLaunching ? {
                          scaleY: [2, 8],
                          opacity: [1, 0],
                          transition: { duration: 0.5, ease: "easeOut" }
                        } : isMobileHovering ? {
                          scaleY: [1, 2.5, 1],
                          opacity: [0.6, 1, 0.6],
                          transition: { duration: 0.15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                        } : {
                          scaleY: 0,
                          opacity: 0,
                          transition: { duration: 0.2 }
                        }
                      }
                    />
                  </div>
                </motion.div>
                
                {/* Floating Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none">
                  <span className="font-mono text-xs font-bold text-cyan-100 tracking-wider bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)] block">REPLAY</span>
                </div>
              </motion.button>`;

const newContent = content.substring(0, startIndex) + newButton + content.substring(endIndex);
fs.writeFileSync('src/components/Hero.tsx', newContent);
console.log("Success");
