// 전체 연결 - 카메라, 손 인식 루프, 스테이지 진행.
//
// 흐름:  버터 → 벌꿀키보드 → 민초 → 탕후루 → 구름
//          → 투표 (제일 좋았던 왁뿌 고르기)
//          → 보너스 (뽑힌 왁뿌를 마음껏 만지기)
//          → finish! 왁뿌숭!!

import { STAGES, ALL_STAGES } from './stages.js';
import {
  initAudio, play, playClear, playFinish,
  loadSamples, loadedSampleCount, getMode, setMode, preview,
} from './audio.js';
import { BothHands, createLandmarker } from './hand.js';
import { Overlay, Cheers } from './effects.js';
import { World } from './scene3d.js';
import { VotePreview } from './votepreview.js';
import { UI } from './ui.js';

const $ = (id) => document.getElementById(id);
const VOTE_KEY = 'wakppusoong.votes';

let world = null;
const overlay = new Overlay($('overlay'));
const cheers = new Cheers($('cheerLayer'));
const ui = new UI();
const hands = new BothHands();

let landmarker = null;
let video = null;
let stageIndex = 0;
let progress = 0;
let locked = true;
let finished = false;
let bonus = false;       // 보너스 라운드에서는 클리어가 없다
let bonusHits = 0;
let votedFor = null;
let votePreview = null;
let lastVideoTime = -1;

const currentStage = () => ALL_STAGES[stageIndex];
const toScreen = (x, y) => ({ x: (1 - x) * window.innerWidth, y: y * window.innerHeight });

// ── 시작 ──────────────────────────────────────────────────────────────────

async function start() {
  const btn = $('startBtn');
  const msg = $('startMsg');

  // file:// 로 열면 카메라 API 자체가 없다. 제일 흔한 실패라 먼저 잡아준다.
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    msg.innerHTML =
      '카메라를 쓸 수 없습니다.<br><b>file:// 로 열면 안 됩니다.</b><br>' +
      '이 폴더에서 <code>python3 -m http.server 8080</code> 을 실행한 뒤<br>' +
      '<code>http://localhost:8080/</code> 으로 접속해주세요.';
    msg.classList.add('err');
    return;
  }

  btn.disabled = true;
  msg.classList.remove('err');

  try {
    msg.textContent = '오디오 준비 중...';
    await initAudio();
    updateSoundBtn(await loadSamples());

    msg.textContent = '카메라 여는 중...';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    });
    video = $('cam');
    video.srcObject = stream;
    await video.play();

    msg.textContent = '3D 월드 만드는 중...';
    world = new World($('scene'));

    msg.textContent = '손 인식 모델 받는 중... (처음 한 번만 오래 걸려요)';
    landmarker = await createLandmarker();

    $('startOverlay').classList.remove('show');
    setStage(0);
    locked = false;
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    msg.classList.add('err');
    if (e && e.name === 'NotAllowedError') {
      msg.textContent = '카메라 권한이 거부됐습니다. 주소창의 카메라 아이콘에서 허용해주세요.';
    } else if (e && e.name === 'NotFoundError') {
      msg.textContent = '카메라를 찾지 못했습니다.';
    } else {
      msg.textContent = '시작하지 못했습니다: ' + (e && e.message ? e.message : e);
    }
  }
}

// ── 스테이지 ──────────────────────────────────────────────────────────────

function setStage(i, asBonus = false) {
  stageIndex = i;
  progress = 0;
  bonus = asBonus;
  bonusHits = 0;
  document.body.classList.toggle('bonus', asBonus);

  const s = currentStage();
  world.setStage(s);
  overlay.setStage(s);
  if (asBonus) ui.setBonus(s);
  else ui.setStage(s, i, ALL_STAGES.length);
}

function onHit(strength, nx, ny) {
  const s = currentStage();
  const p = toScreen(nx, ny);
  const pan = Math.max(-1, Math.min(1, ((1 - nx) - 0.5) * 1.7));

  // 진행도를 같이 넘긴다. 깔수록 남은 왁스가 줄어서
  // 콰작 하는 크랙이 잦아들고 속 말랑이가 눅진하게 눌리는 소리로 넘어간다.
  const ratio = bonus
    ? Math.min(1, bonusHits / 12)
    : (s.target ? progress / s.target : 0);

  play(s.sound, strength, pan, ratio);
  world.hit(strength);
  overlay.burstStars(10 + Math.floor(strength * 10));
  cheers.pop(cheers.pick(s.cheers), p.x, p.y, s.themeDeep);

  // 보너스는 끝이 없다. 그만하기를 누를 때까지 계속 만진다.
  if (bonus) {
    bonusHits++;
    ui.setBonusCount(bonusHits);
    return;
  }

  progress++;
  ui.setProgress(Math.min(progress, s.target), s.target);
  if (progress >= s.target) clearStage();
}

function clearStage() {
  locked = true;
  world.finish();
  overlay.burstStars(30);
  playClear();
  ui.showBanner('CLEAR!', currentStage().name + ' 완료', 1700);

  setTimeout(() => {
    if (stageIndex + 1 < STAGES.length) {
      setStage(stageIndex + 1);
      locked = false;
    } else {
      showVote();
    }
  }, 2100);
}

// ── 투표 ──────────────────────────────────────────────────────────────────

function readVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeVote(id) {
  const v = readVotes();
  v[id] = (v[id] || 0) + 1;
  try { localStorage.setItem(VOTE_KEY, JSON.stringify(v)); } catch (e) { /* 저장 못해도 진행 */ }
  return v;
}

function showVote() {
  locked = true;
  world.hidden = true;
  ui.hideHud(true);

  const grid = $('voteGrid');
  const votes = readVotes();
  grid.innerHTML = '';

  const slots = [];
  STAGES.forEach((s, i) => {
    const card = document.createElement('button');
    card.className = 'vote-card';
    card.style.setProperty('--c', s.bg[1]);
    card.style.setProperty('--d', s.themeDeep);
    card.innerHTML =
      `<span class="vc-slot"></span>` +
      `<span class="vc-name"></span>` +
      `<span class="vc-count"></span>`;
    card.querySelector('.vc-name').textContent = s.name;
    card.querySelector('.vc-count').textContent = `지금까지 ${votes[s.id] || 0}표`;

    card.addEventListener('click', () => castVote(s));
    // 커서를 올린 카드만 밝아지고 커진다
    card.addEventListener('pointerenter', () => votePreview && votePreview.setHover(i));
    card.addEventListener('pointerleave', () => votePreview && votePreview.setHover(-1));

    grid.appendChild(card);
    slots.push({ stage: s, el: card.querySelector('.vc-slot') });
  });

  if (!votePreview) votePreview = new VotePreview($('votePreview'));
  votePreview.mount(slots);

  $('voteOverlay').classList.add('show');
}

function closeVote() {
  $('voteOverlay').classList.remove('show');
  if (votePreview) votePreview.clear();
  ui.hideHud(false);
  world.hidden = false;
}

function castVote(stage) {
  votedFor = stage;
  writeVote(stage.id);
  closeVote();

  const i = STAGES.indexOf(stage);
  setStage(i, true);
  ui.showBanner('보너스!', stage.name + ' 마음껏 만져보세요', 2000);
  locked = false;
}

// ── 엔딩 ──────────────────────────────────────────────────────────────────

function showEnding() {
  finished = true;
  locked = true;
  bonus = false;
  document.body.classList.remove('bonus');

  const pickName = votedFor ? votedFor.name : '';
  $('endPick').textContent = pickName ? `최애 왁뿌: ${pickName}` : '';
  $('endOverlay').classList.add('show');
  playFinish();
  overlay.burstStars(70);
}

// ── 메인 루프 ─────────────────────────────────────────────────────────────

function loop() {
  const now = performance.now();

  if (landmarker && video && video.readyState >= 2) {
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      let res = null;
      try {
        res = landmarker.detectForVideo(video, now);
      } catch (e) {
        // 프레임 하나쯤 실패해도 루프는 계속 돈다
      }
      const events = hands.update(res, now);

      if (!locked && !finished) {
        const want = currentStage().gesture;
        for (const ev of events) {
          if (ev.type === want) onHit(ev.strength, ev.x, ev.y);
        }
      }
    }
  }

  if (world) world.render(now);
  if (votePreview) votePreview.render(now);
  overlay.draw(hands.all);
  updateHandBadge();
  requestAnimationFrame(loop);
}

let badgeCount = -1;
function updateHandBadge() {
  const n = hands.count;
  if (n === badgeCount) return;
  badgeCount = n;
  const el = $('handBadge');
  el.classList.toggle('off', n === 0);
  el.textContent = n === 0 ? '손이 안 보여요' : n === 1 ? '한 손 인식됨' : '양손 인식됨';
}

// ── 사운드 모드 ───────────────────────────────────────────────────────────

function updateSoundBtn(count = loadedSampleCount()) {
  const btn = $('soundBtn');
  const m = getMode();
  btn.textContent = m === 'synth' ? '소리: 합성' : '소리: 샘플';
  btn.classList.toggle('muted', count === 0 && m === 'sample');
  btn.title = count === 0
    ? 'sounds/ 폴더에 음원을 넣으면 샘플 모드를 쓸 수 있어요'
    : `샘플 ${count}개 불러옴`;
}

$('soundBtn').addEventListener('click', () => {
  setMode(getMode() === 'synth' ? 'sample' : 'synth');
  updateSoundBtn();
  const s = currentStage();
  preview(s ? s.sound : 'mintcrack');
});

// ── 이벤트 ────────────────────────────────────────────────────────────────

$('startBtn').addEventListener('click', start);

$('endBtn').addEventListener('click', () => {
  if (bonus) showEnding();
});

$('againBtn').addEventListener('click', () => {
  $('endOverlay').classList.remove('show');
  finished = false;
  votedFor = null;
  setStage(0);
  locked = false;
});

$('camToggle').addEventListener('click', () => {
  $('camWrap').classList.toggle('show');
});

// 숫자키로 왁뿌를 바로 골라 본다.
// 앞 스테이지를 다 깨야만 뒤를 볼 수 있으면 확인하기가 너무 번거롭다.
// 1 버터 · 2 벌꿀키보드 · 3 민초 · 4 탕후루 · 5 구름
window.addEventListener('keydown', (e) => {
  if (!world || finished) return;
  const n = parseInt(e.key, 10);
  if (!n || n < 1 || n > STAGES.length) return;
  closeVote();
  setStage(n - 1);
  locked = false;
});
