let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;

const MELODY = [523.25, 587.33, 659.25, 523.25, 659.25, 587.33, 523.25, 493.88];

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playTone(
  freq: number,
  durationMs: number,
  type: OscillatorType = "square",
  volume = 0.12,
) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audio.currentTime + durationMs / 1000,
  );
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + durationMs / 1000);
}

export function sfxMove() {
  playTone(220, 35, "square", 0.05);
}

export function sfxRotate() {
  playTone(330, 55, "square", 0.07);
}

export function sfxDrop() {
  playTone(110, 90, "square", 0.12);
}

export function sfxLineClear(lines: number) {
  for (let i = 0; i < lines; i++) {
    setTimeout(() => playTone(440 + i * 120, 150, "square", 0.15), i * 70);
  }
}

export function sfxClear() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    setTimeout(() => playTone(f, 200, "triangle", 0.16), i * 120),
  );
}

export function sfxGameOver() {
  [392, 349.23, 293.66, 261.63].forEach((f, i) =>
    setTimeout(() => playTone(f, 250, "sawtooth", 0.12), i * 150),
  );
}

export function startMusic() {
  if (musicTimer) return;
  const audio = getCtx();
  if (!audio) return;
  musicTimer = setInterval(() => {
    playTone(MELODY[musicStep % MELODY.length], 220, "triangle", 0.05);
    musicStep++;
  }, 260);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
    musicStep = 0;
  }
}
