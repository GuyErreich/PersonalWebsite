type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

const getCtx = (): AudioContext | null => {
  try {
    const AudioCtx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  } catch {
    return null;
  }
};

/** 8-bit ascending chime: C5 → E5 → G5 → C6 (square wave) */
export const playGameDevChime = () => {
  const ctx = getCtx();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const t = ctx.currentTime + i * 0.12;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
};

/** Rising terminal beeps: 440 Hz → 520 Hz → 880 Hz (sine) */
export const playDevOpsBeeps = () => {
  const ctx = getCtx();
  if (!ctx) return;
  [0, 0.46, 0.92].forEach((offset, i) => {
    const freq = i === 2 ? 880 : 440 + i * 80;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime + offset;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.02, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
};
