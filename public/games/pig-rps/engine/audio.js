// Web Audio 로 그 자리에서 만드는 효과음. 음원 파일은 쓰지 않는다.
//
// AudioContext 는 사용자 제스처 안에서 만들어야 한다.
// 시작 버튼 클릭 때 unlock() 을 부르는 이유다.

let ctx = null;

export function unlock() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function envelope(dur, peak = 0.25) {
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  gain.connect(ctx.destination);
  return gain;
}

function tone(freq, dur, { type = 'triangle', peak = 0.25, slideTo = null } = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const t = ctx.currentTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  osc.connect(envelope(dur, peak));
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// 카운트다운 "가위" "바위" 는 낮게, "보!" 는 한 옥타브 위로 올려서
// 언제 손을 내밀어야 하는지 소리만 듣고도 알 수 있게 한다.
export function countBeep(step) {
  const freqs = [440, 494, 880];
  tone(freqs[step] || 440, step === 2 ? 0.22 : 0.12, { peak: step === 2 ? 0.3 : 0.18 });
}

export function outcomeSound(outcome) {
  if (!ctx) return;
  if (outcome === 'win') {
    tone(660, 0.14, { peak: 0.26 });
    setTimeout(() => tone(880, 0.2, { peak: 0.26 }), 120);
    setTimeout(() => tone(1180, 0.28, { peak: 0.22 }), 240);
  } else if (outcome === 'lose') {
    tone(340, 0.32, { type: 'sawtooth', peak: 0.18, slideTo: 150 });
  } else {
    tone(520, 0.16, { peak: 0.16 });
    setTimeout(() => tone(520, 0.16, { peak: 0.14 }), 150);
  }
}

export function fanfare(won) {
  if (!ctx) return;
  const notes = won ? [523, 659, 784, 1046] : [523, 440, 392, 330];
  notes.forEach((f, i) => setTimeout(() => tone(f, 0.3, { peak: 0.24 }), i * 150));
}

// 손을 못 읽어 라운드를 다시 칠 때
export function retrySound() {
  tone(300, 0.18, { type: 'square', peak: 0.12 });
}
