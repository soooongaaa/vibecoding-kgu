"use client";

// Every sound in this game is synthesized with the Web Audio API — no audio
// files to source or ship, and nothing to fetch over the network.

type ToneOptions = {
  duration?: number;
  type?: OscillatorType;
  startTime?: number;
  gain?: number;
};

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(ctx: AudioContext, freq: number, options: ToneOptions = {}) {
  const { duration = 0.12, type = "sine", startTime = 0, gain = 0.16 } = options;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startTime;
  gainNode.gain.setValueAtTime(0, t0);
  gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gainNode).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export const SFX = {
  click() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 880, { duration: 0.08, type: "sine", gain: 0.14 });
  },
  success() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      playTone(ctx, freq, { duration: 0.18, type: "triangle", startTime: i * 0.09, gain: 0.16 });
    });
  },
  fail() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    playTone(ctx, 220, { duration: 0.22, type: "sawtooth", gain: 0.15 });
    playTone(ctx, 160, { duration: 0.28, type: "sawtooth", startTime: 0.08, gain: 0.13 });
  },
};

// ---- looping background music (tiny synthesized melody) ----
const BGM_NOTES = [523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25];
const BGM_STEP_MS = 300;

let bgmHandle: ReturnType<typeof setInterval> | null = null;
let bgmStep = 0;
let bgmMuted = false;

export function startBgm() {
  if (bgmHandle) return; // already playing — retries shouldn't restart the loop
  const ctx = getAudioCtx();
  if (!ctx) return;
  bgmHandle = setInterval(() => {
    if (bgmMuted) return;
    playTone(ctx, BGM_NOTES[bgmStep % BGM_NOTES.length], { duration: 0.24, type: "triangle", gain: 0.045 });
    bgmStep += 1;
  }, BGM_STEP_MS);
}

export function setBgmMuted(muted: boolean) {
  bgmMuted = muted;
}

export function unlockAudio() {
  getAudioCtx();
}
