let ctx: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;

const MELODY = [392, 493.88, 587.33, 493.88, 392, 293.66, 349.23, 392];

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

export function sfxWallBounce() {
  playTone(300, 40, "square", 0.06);
}

export function sfxPaddleHit() {
  playTone(440, 50, "square", 0.09);
}

export function sfxBrickBreak() {
  playTone(660, 70, "square", 0.1);
}

export function sfxLifeLost() {
  playTone(150, 300, "sawtooth", 0.15);
}

export function sfxClear() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    setTimeout(() => playTone(f, 200, "triangle", 0.16), i * 120),
  );
}

export function sfxWin() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    setTimeout(() => playTone(f, 180, "triangle", 0.16), i * 100),
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
    playTone(MELODY[musicStep % MELODY.length], 240, "triangle", 0.045);
    musicStep++;
  }, 300);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
    musicStep = 0;
  }
}
