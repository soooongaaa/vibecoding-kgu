// 아기돼지 가위바위보 — 전체 연결.
//
// 상태 머신 하나로 돌아간다.
//   idle → countdown → capture → reveal → (countdown | finished)
//
// 인식 루프는 상태와 무관하게 매 프레임 돈다. 손 뼈대를 계속 그려야
// 사용자가 자기 손이 잡히고 있는지 알 수 있기 때문이다.
// capture 상태일 때만 그 결과를 표에 넣는다.

import { createRecognizer, readShape, readLandmarks, ShapeVote, SHAPES } from './gesture.js';
import { Match, judge, randomShape } from './round.js';
import { Overlay } from './overlay.js';
import { UI } from './ui.js';
import { unlock, countBeep, outcomeSound, fanfare, retrySound } from './audio.js';
import { rescue } from '../../_shared/rescue.js';

const $ = (id) => document.getElementById(id);

const COUNT_STEPS = ['가위', '바위', '보!'];
const COUNT_INTERVAL = 700;  // 카운트 한 글자 간격(ms)
const CAPTURE_MS = 500;      // "보!" 뒤 손 모양을 모으는 구간
const REVEAL_MS = 1800;      // 결과를 보여주는 시간

const video = $('cam');
const ui = new UI();
const overlay = new Overlay($('overlay'));
const match = new Match();
const vote = new ShapeVote();

let recognizer = null;
let state = 'idle';
let lastVideoTime = -1;
let captureUntil = 0;
let timers = [];

function later(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

async function openCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

function loop() {
  requestAnimationFrame(loop);
  if (!recognizer || video.readyState < 2) return;

  // 같은 프레임을 두 번 넣으면 MediaPipe 가 타임스탬프 오류를 낸다.
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;

  const result = recognizer.recognizeForVideo(video, performance.now());
  const landmarks = readLandmarks(result);
  const shape = readShape(result);

  overlay.clear();
  if (landmarks) overlay.drawHand(landmarks, shape ? '#e891a8' : '#b8a6d0');
  ui.setHandVisible(Boolean(landmarks));

  if (state === 'capture') {
    vote.push(shape);
    if (performance.now() >= captureUntil) settle();
  }
}

function startCountdown() {
  state = 'countdown';
  ui.hideBanner();
  ui.clearShapes();
  ui.setHint('카운트에 맞춰 손을 내밀어요');
  ui.setScore(match.wins, match.losses, match.round);

  COUNT_STEPS.forEach((word, i) => {
    later(() => {
      ui.showCount(word);
      countBeep(i);
      if (i === COUNT_STEPS.length - 1) beginCapture();
    }, i * COUNT_INTERVAL);
  });
}

function beginCapture() {
  state = 'capture';
  vote.start();
  captureUntil = performance.now() + CAPTURE_MS;
}

function settle() {
  state = 'reveal';
  ui.hideCount();
  ui.setHint('');

  const mine = vote.result();

  // 손을 제대로 못 읽었으면 승패에 반영하지 않고 그 판을 다시 친다.
  if (!mine) {
    retrySound();
    ui.showBanner('손이 잘 안 보였어요', 'draw');
    later(() => {
      ui.hideBanner();
      startCountdown();
    }, 1400);
    return;
  }

  const theirs = randomShape();
  const outcome = judge(mine, theirs);

  ui.showShapes(mine, theirs);
  outcomeSound(outcome);

  const text = outcome === 'win' ? '이겼다!' : outcome === 'lose' ? '졌다!' : '비겼다';
  ui.showBanner(text, outcome);

  const finished = match.record(outcome);
  ui.setScore(match.wins, match.losses, match.round);

  later(() => {
    if (finished) {
      state = 'finished';
      ui.hideBanner();
      ui.showEnd(match.won, match.wins, match.losses);
      fanfare(match.won);
      // 져도 종료 화면은 뜬다. 구출 배너는 이겼을 때만 보여야 한다.
      document.body.classList.toggle('rps-won', match.won);
      if (match.won) rescue('pig');
    } else {
      startCountdown();
    }
  }, REVEAL_MS);
}

async function start() {
  const btn = $('startBtn');
  btn.disabled = true;
  unlock();
  ui.setStartMsg('카메라 여는 중…');

  try {
    await openCamera();
  } catch {
    btn.disabled = false;
    ui.setStartMsg('카메라를 열 수 없어요. 권한을 허용해 주세요.');
    return;
  }

  ui.setStartMsg('손 인식 준비 중…');
  try {
    recognizer = await createRecognizer();
  } catch {
    btn.disabled = false;
    ui.setStartMsg('손 인식 모델을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
    return;
  }

  ui.hideStart();
  match.reset();
  loop();
  later(startCountdown, 600);
}

function playAgain() {
  clearTimers();
  document.body.classList.remove('rps-won');
  match.reset();
  ui.hideEnd();
  ui.clearShapes();
  ui.setScore(0, 0, 1);
  later(startCountdown, 400);
}

$('startBtn').addEventListener('click', start);
$('againBtn').addEventListener('click', playAgain);

ui.setScore(0, 0, 1);
ui.clearShapes();
