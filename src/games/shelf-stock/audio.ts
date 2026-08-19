/*
 * Web Audio API 로 직접 합성하는 사운드 모듈.
 * 음원 파일이나 외부 라이브러리 없이 오실레이터만으로 BGM/효과음을 만든다.
 * 브라우저 자동재생 정책 때문에 AudioContext 는 첫 사용자 조작 시점에 만들어진다.
 */

type AudioContextCtor = typeof AudioContext;

interface AudioGlobals {
  AudioContext?: AudioContextCtor;
  webkitAudioContext?: AudioContextCtor;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bgmTimer: number | null = null;
let nextStepTime = 0;
let stepIndex = 0;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;

  let current = ctx;
  if (!current) {
    const globals = window as unknown as AudioGlobals;
    const Ctor = globals.AudioContext ?? globals.webkitAudioContext;
    if (!Ctor) return null;

    current = new Ctor();
    const gain = current.createGain();
    gain.gain.value = 0.6;
    gain.connect(current.destination);

    ctx = current;
    master = gain;
  }

  if (current.state === "suspended") {
    void current.resume();
  }
  return current;
}

interface ToneOptions {
  freq: number;
  /** 지금으로부터 몇 초 뒤에 울릴지 */
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

function tone({ freq, start, duration, type = "triangle", gain = 0.2 }: ToneOptions) {
  const c = getCtx();
  if (!c || !master) return;

  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const env = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  // 0 에서 시작하면 exponentialRamp 가 동작하지 않으므로 아주 작은 값에서 출발한다.
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/* ── BGM: 아기자기한 편의점 루프 ─────────────── */

const N = {
  C3: 130.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
} as const;

const STEP_SECONDS = 0.2;

const MELODY: (number | null)[] = [
  N.E5, N.G5, N.E5, N.C5, N.D5, N.E5, N.D5, null,
  N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, null,
  N.C5, N.E5, N.D5, N.C5, N.A4, N.C5, N.D5, null,
  N.E5, N.D5, N.C5, N.D5, N.E5, N.G5, N.C5, null,
];

const BASS: (number | null)[] = [
  N.C3, null, null, null, N.G3, null, null, null,
  N.C3, null, null, null, N.A3, null, null, null,
  N.F3, null, null, null, N.C3, null, null, null,
  N.G3, null, null, null, N.C3, null, null, null,
];

function scheduleBgm() {
  const c = getCtx();
  if (!c) return;

  // 0.3초 앞까지 미리 예약해 두어 setInterval 지터에도 박자가 흔들리지 않게 한다.
  while (nextStepTime < c.currentTime + 0.3) {
    const i = stepIndex % MELODY.length;
    const offset = Math.max(0, nextStepTime - c.currentTime);

    const melodyNote = MELODY[i];
    if (melodyNote) {
      tone({
        freq: melodyNote,
        start: offset,
        duration: STEP_SECONDS * 1.7,
        type: "triangle",
        gain: 0.075,
      });
    }

    const bassNote = BASS[i];
    if (bassNote) {
      tone({
        freq: bassNote,
        start: offset,
        duration: STEP_SECONDS * 3,
        type: "sine",
        gain: 0.1,
      });
    }

    nextStepTime += STEP_SECONDS;
    stepIndex += 1;
  }
}

export function startBgm() {
  if (muted || bgmTimer !== null) return;

  const c = getCtx();
  if (!c) return;

  nextStepTime = c.currentTime + 0.1;
  stepIndex = 0;
  scheduleBgm();
  bgmTimer = window.setInterval(scheduleBgm, 120);
}

export function stopBgm() {
  if (bgmTimer === null) return;
  window.clearInterval(bgmTimer);
  bgmTimer = null;
}

/** 첫 사용자 조작에서 호출해 오디오를 깨운다. 이미 켜져 있으면 아무 일도 하지 않는다. */
export function unlockAudio() {
  startBgm();
}

export function setMuted(next: boolean) {
  muted = next;
  if (next) {
    stopBgm();
  } else {
    startBgm();
  }
}

/* ── 효과음 ──────────────────────────────────── */

/** 정답: 밝게 올라가는 아르페지오 + 반짝이는 꼬리음 */
export function playSuccess() {
  if (muted) return;
  tone({ freq: 880, start: 0, duration: 0.16, gain: 0.22 });
  tone({ freq: 1108.73, start: 0.07, duration: 0.16, gain: 0.22 });
  tone({ freq: 1318.51, start: 0.14, duration: 0.18, gain: 0.22 });
  tone({ freq: 1760, start: 0.22, duration: 0.34, type: "sine", gain: 0.16 });
}

/** 오답: 낮게 떨어지는 짧은 부저음 */
export function playFail() {
  if (muted) return;
  tone({ freq: 233.08, start: 0, duration: 0.15, type: "square", gain: 0.11 });
  tone({ freq: 164.81, start: 0.1, duration: 0.26, type: "square", gain: 0.11 });
}

/** 시간 초과: 힘없이 미끄러지는 하강음 */
export function playGameOver() {
  if (muted) return;
  tone({ freq: 392, start: 0, duration: 0.26, gain: 0.19 });
  tone({ freq: 329.63, start: 0.18, duration: 0.26, gain: 0.19 });
  tone({ freq: 261.63, start: 0.36, duration: 0.3, gain: 0.19 });
  tone({ freq: 196, start: 0.56, duration: 0.62, type: "sawtooth", gain: 0.14 });
}

/** 전체 진열 완료: 짧은 팡파르 */
export function playFanfare() {
  if (muted) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    tone({ freq, start: i * 0.1, duration: 0.24, gain: 0.2 });
  });
  tone({ freq: 1567.98, start: 0.42, duration: 0.6, type: "sine", gain: 0.17 });
}
