// 오디오 엔진. 두 가지 모드를 버튼으로 즉시 갈아끼울 수 있다.
//
//  synth  - 파일 없이 그 자리에서 합성. 그래뉼러 방식으로 미세한 파사삭
//           입자를 수십 개 쌓아 진짜 크랙 소리에 가깝게 만든다.
//  sample - sounds/ 폴더에 넣어둔 실제 녹음을 재생. 단, 그냥 틀지 않고
//           칠 때마다 피치·필터·시작위치·레이어를 흔들어서
//           같은 소리가 두 번 나오지 않게 한다.
//
// 어느 쪽이든 "매번 조금씩 다르게 들린다"는 성질은 유지된다.

let ctx = null;
let master = null;
let wet = null;
let noiseBuf = null;

let mode = 'synth';
const samples = {};              // name -> AudioBuffer
const SAMPLE_NAMES = ['butter', 'honey', 'mintcrack', 'tanghulu', 'cloud'];
const EXTS = ['mp3', 'wav', 'ogg', 'm4a'];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function getMode() { return mode; }
export function setMode(m) { mode = m; }
export function hasSample(name) { return !!samples[name]; }
export function loadedSampleCount() { return Object.keys(samples).length; }

export async function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') await ctx.resume();
    return;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  master = ctx.createGain();
  master.gain.value = 0.9;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 24;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;

  master.connect(comp);
  comp.connect(ctx.destination);

  // ASMR 공간감. 임펄스도 합성해서 만든다.
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(1.7, 3.0);
  wet = ctx.createGain();
  // 리버브를 세게 걸면 짧은 파열음이 "삐잉" 하고 울려서 기계음처럼 들린다.
  wet.gain.value = 0.1;
  wet.connect(conv);
  conv.connect(master);

  noiseBuf = makeNoise(2);

  if (ctx.state === 'suspended') await ctx.resume();
}

function makeNoise(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeImpulse(seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

// ── 샘플 로딩 ─────────────────────────────────────────────────────────────
// sounds/ 에 파일이 있으면 쓰고, 없으면 조용히 넘어간다.

export async function loadSamples() {
  if (!ctx) return 0;
  await Promise.all(SAMPLE_NAMES.map(async (name) => {
    for (const ext of EXTS) {
      try {
        const res = await fetch(`sounds/${name}.${ext}`);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        samples[name] = await ctx.decodeAudioData(buf);
        return;
      } catch (e) {
        // 파일이 없거나 못 읽으면 다음 확장자로
      }
    }
  }));
  return Object.keys(samples).length;
}

// ── 공통 부품 ─────────────────────────────────────────────────────────────

function outChain(pan) {
  const g = ctx.createGain();
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    p.connect(master);
    p.connect(wet);
  } else {
    g.connect(master);
    g.connect(wet);
  }
  return g;
}

function noiseSource(rate = 1) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  s.playbackRate.value = rate;
  return s;
}

function noiseBurst({ t0, dur, type, freq, q = 1, gain, pan = 0, sweepTo = null, attack = 0.004 }) {
  const src = noiseSource(rnd(0.85, 1.15));
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(freq, t0);
  filt.Q.value = q;
  if (sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 20), t0 + dur);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const out = outChain(pan);
  src.connect(filt); filt.connect(env); env.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

function toneHit({ t0, dur, type = 'sine', f0, f1, gain, pan = 0 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const out = outChain(pan);
  osc.connect(env); env.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// 그래뉼러 크래클.
//
// 진짜 부서지는 소리는 균일한 노이즈가 아니라
// 아주 짧은 파열음 수십 개가 불규칙한 간격으로 터지는 것이다.
// 간격을 지수분포로 흩뿌리고 뒤로 갈수록 밀도와 크기를 줄인다.
//
// !! Q 를 높이면 안 된다. 공명이 생기면서 음정이 붙어
//    "와그작" 이 아니라 "핑!" 하는 기계음이 된다. 1.4 를 넘기지 말 것.
function granular({ t0, span, count, fLo, fHi, gain, pan, grainLo = 0.003, grainHi = 0.014, q = 1 }) {
  const Q = Math.min(q, 1.4);
  let t = t0;
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const step = -Math.log(1 - Math.random()) * (span / count) * (0.5 + progress * 1.8);
    t += step;
    if (t > t0 + span * 1.6) break;

    const fade = Math.pow(1 - progress, 1.4);
    // 알갱이 크기를 들쭉날쭉하게. 가끔 유난히 큰 놈이 튀어야 우두둑거린다.
    const spike = Math.random() < 0.12 ? rnd(1.8, 3.2) : 1;

    noiseBurst({
      t0: t,
      dur: rnd(grainLo, grainHi) * spike,
      type: 'bandpass',
      freq: rnd(fLo, fHi) * rnd(0.75, 1.3),
      q: rnd(Q * 0.6, Q),
      gain: gain * fade * rnd(0.2, 1) * spike,
      pan: pan + rnd(-0.35, 0.35),
      attack: 0.0006,
    });
  }
}

// 와그작의 몸통. 저중역이 우두둑거려야 "무언가 두꺼운 게 부서진다"고 들린다.
// 이게 없으면 아무리 고역 입자를 쌓아도 얇고 기계적으로만 들린다.
function crunchBody({ t0, span, count, gain, pan }) {
  granular({
    t0, span, count,
    fLo: 160, fHi: 900,
    gain, pan,
    grainLo: 0.008, grainHi: 0.03,
    q: 1.1,
  });
}

// 첫 파열. 아주 짧고 넓은 대역이어야 딱 하고 붙는다.
function transient({ t0, gain, pan, freq = 700 }) {
  noiseBurst({
    t0, dur: rnd(0.004, 0.009), type: 'highpass',
    freq, q: 0.7, gain, pan, attack: 0.0004,
  });
  noiseBurst({
    t0, dur: rnd(0.05, 0.09), type: 'lowpass',
    freq: rnd(150, 280), q: 0.8, gain: gain * 0.8, pan, attack: 0.002,
  });
}

// "코아작" 의 '작' — 끝이 눅진하게 물러지는 꼬리.
// 왁스 밑의 말랑한 속이 눌리는 소리다. 딱 끊기면 안 되고 축 늘어져야 한다.
function wetTail({ t0, gain, pan, dur = 0.26 }) {
  // 축축하게 주저앉는 저역
  noiseBurst({
    t0: t0 + rnd(0.01, 0.03), dur: dur * rnd(0.9, 1.25), type: 'lowpass',
    freq: rnd(420, 700), q: 1.0, gain, pan,
    sweepTo: rnd(120, 210), attack: 0.035,
  });
  // 눅진한 중역 몸통
  noiseBurst({
    t0: t0 + rnd(0.02, 0.05), dur: dur * rnd(0.6, 0.9), type: 'bandpass',
    freq: rnd(260, 620), q: 1.2, gain: gain * 0.55, pan, attack: 0.05,
  });
  // 아주 성긴 물기 있는 알갱이
  granular({
    t0: t0 + 0.03, span: dur * 0.8, count: 8,
    fLo: 200, fHi: 700, gain: gain * 0.22, pan,
    grainLo: 0.015, grainHi: 0.045, q: 1.1,
  });
}

// ── 합성 신스 ─────────────────────────────────────────────────────────────
//
// p = 진행도 0~1. 왁뿌를 칠수록 올라간다.
// 왁스 막은 칠수록 벗겨져서 깰 게 줄어들고, 그만큼 속 말랑이가 드러난다.
// 그래서 소리도 "콰작" 쪽에서 "눅진" 쪽으로 서서히 넘어가야 한다.

const waxLeft = (p) => 1 - Math.min(1, p) * 0.62;   // 남은 왁스 = 크랙의 양
const wetness = (p) => 0.35 + Math.min(1, p) * 0.65; // 드러난 말랑이 = 눅진함

// 잔음. "콰자아악ㄱ.." 의 마지막 'ㄱ..' 부분.
// 다 깨지고 나서 뒤늦게 몇 알갱이가 뒤척이다가 톡 하고 멎는다.
function residue({ t0, gain, pan }) {
  granular({
    t0: t0 + 0.2, span: 0.42, count: 11,
    fLo: 800, fHi: 3400, gain, pan,
    grainLo: 0.004, grainHi: 0.018, q: 1.2,
  });
  // 마지막에 남는 한 알
  noiseBurst({
    t0: t0 + rnd(0.4, 0.62), dur: rnd(0.015, 0.03), type: 'bandpass',
    freq: rnd(700, 2100), q: 1.3, gain: gain * 1.5, pan, attack: 0.001,
  });
}

// 푹신한 꼬리. 구름처럼 속이 폭신한 것에 쓴다.
function fluffTail({ t0, gain, pan, dur = 0.5 }) {
  noiseBurst({
    t0, dur, type: 'lowpass', freq: rnd(750, 1150), q: 0.9,
    gain, pan, sweepTo: rnd(150, 290), attack: 0.09,
  });
  noiseBurst({
    t0: t0 + 0.05, dur: dur * 0.7, type: 'bandpass', freq: rnd(280, 620),
    q: 1.0, gain: gain * 0.4, pan, attack: 0.13,
  });
}

// ── 왁뿌 소리의 공통 뼈대 ────────────────────────────────────────────────
//
// 민초와 탕후루가 잘 나와서, 그 둘의 구조를 하나로 뽑아 공통 재료로 삼는다.
// 나머지 왁뿌는 여기에 밝기 / 두께 / 눅진함 비율만 달리해서 배합한다.
//
//   bright  : 첫 파열의 밝기. 낮으면 둔탁, 높으면 쨍하다
//   thick   : 몸통 우두둑의 두께. 두꺼운 초콜릿 1.0, 얇은 유리 0.5
//   wet     : 눅진한 꼬리의 비중
//   debris  : 부스러기가 흩어지는 주파수 범위
function crackVoice({ v, pan, p, bright, thick, wet, tail, debris, res = 0, fluff = 0 }) {
  const t = ctx.currentTime;
  const wax = waxLeft(p);
  const wetAmt = wetness(p);

  // 코 : 왁스 막이 갈라진다
  transient({ t0: t, gain: v * 1.15 * wax, pan, freq: bright });
  crunchBody({
    t0: t + 0.005,
    span: 0.14 + thick * 0.12,
    count: Math.round(18 + thick * 16),
    gain: v * 0.8 * thick * wax,
    pan,
  });
  noiseBurst({
    t0: t, dur: rnd(0.1, 0.18) * (0.6 + thick * 0.6), type: 'lowpass',
    freq: rnd(170, 330), q: 0.9, gain: v * 0.45 * thick * wax, pan, attack: 0.004,
  });
  granular({
    t0: t + 0.02, span: 0.3 + thick * 0.12, count: Math.round(30 + (1 - thick) * 24),
    fLo: debris[0], fHi: debris[1], gain: v * 0.3 * wax, pan, q: 1.25,
    grainLo: 0.003, grainHi: 0.016,
  });

  // 작 : 속이 물러지는 꼬리
  if (wet > 0) wetTail({ t0: t + 0.02, gain: v * wet * wetAmt, pan, dur: tail });
  if (fluff > 0) fluffTail({ t0: t + 0.03, gain: v * fluff * wetAmt, pan, dur: tail * 1.6 });
  if (res > 0) residue({ t0: t, gain: v * res * wax, pan });
}

const SYNTHS = {
  // 버터: 민초를 둔탁하게 내린 배합. 무르고 낮게, 눅진함은 최대로.
  butter(s, pan, p = 0) {
    crackVoice({
      v: 0.21 + s * 0.3, pan, p,
      bright: rnd(320, 560), thick: 0.95, wet: 0.95, tail: 0.36,
      debris: [500, 2000], res: 0.1,
    });
  },

  // 벌꿀 키보드: 여긴 부서지는 스테이지가 아니다.
  // 키캡이 바닥을 치는 타건감 - 딸깍 + 통울림(thock) + 짧은 꼬리.
  honey(s, pan) {
    const t = ctx.currentTime;
    const v = 0.22 + s * 0.3;
    // 스템이 바닥에 닿는 순간
    transient({ t0: t, gain: v * 0.85, pan, freq: rnd(1900, 3300) });
    // 키캡 안쪽 통울림. 이게 두꺼워야 "톡" 이 아니라 "톡-" 하고 붙는다.
    noiseBurst({
      t0: t, dur: rnd(0.06, 0.1), type: 'lowpass',
      freq: rnd(400, 700), q: 1.1, gain: v * 0.95, pan, attack: 0.002,
    });
    noiseBurst({
      t0: t + 0.004, dur: rnd(0.03, 0.055), type: 'bandpass',
      freq: rnd(900, 1700), q: 1.2, gain: v * 0.5, pan, attack: 0.001,
    });
    // 꿀 키보드니까 끝이 아주 살짝 눅진하다
    wetTail({ t0: t + 0.008, gain: v * 0.28, pan, dur: 0.13 });
  },

  // 민초 "콰자아악ㄱ..". 두꺼운 초콜릿 + 눅진한 속 + 뒤늦은 잔음.
  mintcrack(s, pan, p = 0) {
    crackVoice({
      v: 0.2 + s * 0.3, pan, p,
      bright: rnd(500, 900), thick: 1, wet: 0.75, tail: 0.3,
      debris: [1100, 4200], res: 0.16,
    });
  },

  // 탕후루: 얇고 단단한 껍질. 민초보다 밝고 짧게.
  tanghulu(s, pan, p = 0) {
    crackVoice({
      v: 0.19 + s * 0.28, pan, p,
      bright: rnd(1400, 2400), thick: 0.5, wet: 0.62, tail: 0.24,
      debris: [2200, 7000], res: 0.12,
    });
  },

  // 구름: 콰자악 + (푹신). 얇은 왁스가 갈라지고 속은 폭신하게 꺼진다.
  cloud(s, pan, p = 0) {
    crackVoice({
      v: 0.18 + s * 0.26, pan, p,
      bright: rnd(800, 1400), thick: 0.45, wet: 0.3, tail: 0.34,
      debris: [1400, 4500], res: 0.08, fluff: 0.8,
    });
  },

};

// ── 샘플 재생 ─────────────────────────────────────────────────────────────
// 실제 녹음이지만 매번 다르게 들리도록 흔든다.

function playSample(name, s, pan, prog = 0) {
  const buf = samples[name];
  if (!buf) return false;

  const t = ctx.currentTime;
  const layers = Math.random() < 0.35 ? 2 : 1;

  for (let i = 0; i < layers; i++) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    // 피치를 흔들어 같은 소리로 안 들리게.
    // 깔수록 조금씩 느려지고 낮아져서 눅진하게 들린다.
    src.playbackRate.value = rnd(0.86, 1.16) * (1 - prog * 0.12) * (i ? rnd(0.95, 1.05) : 1);

    // 톤도 매번 살짝 바꾼다. 진행될수록 고역을 깎아 물러지게.
    const filt = ctx.createBiquadFilter();
    if (Math.random() < 0.5) {
      filt.type = 'highshelf';
      filt.frequency.value = rnd(2000, 5000);
      filt.gain.value = rnd(-5, 5) - prog * 6;
    } else {
      filt.type = 'lowpass';
      filt.frequency.value = rnd(4000, 16000) * (1 - prog * 0.45);
      filt.Q.value = 0.7;
    }

    const env = ctx.createGain();
    const vol = (0.35 + s * 0.65) * (i ? rnd(0.25, 0.5) : 1);
    env.gain.setValueAtTime(vol, t);

    const out = outChain(pan + (i ? rnd(-0.3, 0.3) : rnd(-0.12, 0.12)));
    src.connect(filt); filt.connect(env); env.connect(out);

    // 시작 지점을 조금씩 옮겨 어택의 결을 바꾼다
    const offset = rnd(0, Math.min(0.03, buf.duration * 0.1));
    const delay = i ? rnd(0.01, 0.05) : 0;
    src.start(t + delay, offset);
  }
  return true;
}

// ── 재생 진입점 ───────────────────────────────────────────────────────────

// progress: 이 왁뿌를 얼마나 깠는지 0~1. 소리가 점점 눅진해진다.
export function play(name, strength = 0.5, pan = 0, progress = 0) {
  if (!ctx) return;
  const s = Math.max(0, Math.min(1, strength));
  const p = Math.max(-1, Math.min(1, pan));
  const prog = Math.max(0, Math.min(1, progress));

  if (mode === 'sample' && samples[name]) {
    playSample(name, s, p, prog);
    return;
  }
  const fn = SYNTHS[name];
  if (fn) fn(s, p, prog);
}

// ── UI 사운드 (항상 합성) ─────────────────────────────────────────────────

export function playStar() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    toneHit({
      t0: t + i * 0.045, dur: 0.16, type: 'sine',
      f0: rnd(1600, 2400) * (1 + i * 0.35),
      f1: rnd(2600, 4200) * (1 + i * 0.35),
      gain: 0.05, pan: rnd(-0.4, 0.4),
    });
  }
}

export function playClear() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    toneHit({ t0: t + i * 0.1, dur: 0.42, type: 'triangle', f0: f, f1: f, gain: 0.13, pan: rnd(-0.2, 0.2) });
    toneHit({ t0: t + i * 0.1, dur: 0.3, type: 'sine', f0: f * 2, f1: f * 2, gain: 0.05, pan: 0 });
  });
}

export function playFinish() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    toneHit({ t0: t + i * 0.12, dur: 0.6, type: 'triangle', f0: f, f1: f, gain: 0.14, pan: rnd(-0.3, 0.3) });
  });
  for (let i = 0; i < 14; i++) {
    noiseBurst({
      t0: t + rnd(0, 0.9), dur: rnd(0.08, 0.2), type: 'highpass',
      freq: rnd(3000, 7000), q: 1, gain: 0.05, pan: rnd(-0.8, 0.8),
    });
  }
}

// 소리 비교용 - 지금 모드로 한 번 들려준다
export function preview(name) {
  play(name, 0.75, 0);
}

export { SAMPLE_NAMES };
