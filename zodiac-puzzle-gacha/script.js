const STORAGE_KEY = 'zodiacGameState';

const ZODIAC = [
  { id: 'rat', name: '쥐', emoji: '🐀' },
  { id: 'ox', name: '소', emoji: '🐂' },
  { id: 'tiger', name: '호랑이', emoji: '🐅' },
  { id: 'rabbit', name: '토끼', emoji: '🐇' },
  { id: 'dragon', name: '용', emoji: '🐉' },
  { id: 'snake', name: '뱀', emoji: '🐍' },
  { id: 'horse', name: '말', emoji: '🐎' },
  { id: 'goat', name: '양', emoji: '🐐' },
  { id: 'monkey', name: '원숭이', emoji: '🐒' },
  { id: 'rooster', name: '닭', emoji: '🐓' },
  { id: 'dog', name: '개', emoji: '🐕' },
  { id: 'pig', name: '돼지', emoji: '🐖' },
];

const GACHA_COST = 80;
const DIRECT_PURCHASE_COST = 300;
const BASE_REWARD = 30;
const REWARD_PER_STAGE = 10;
const STAGE_CONFIGS = [
  { pairs: 4, time: 45 },
  { pairs: 6, time: 60 },
  { pairs: 8, time: 75 },
  { pairs: 10, time: 90 },
  { pairs: 12, time: 110 },
];

function getStageConfig(stage) {
  const idx = Math.min(stage - 1, STAGE_CONFIGS.length - 1);
  return STAGE_CONFIGS[idx];
}

function defaultState() {
  const owned = {};
  ZODIAC.forEach(a => { owned[a.id] = 0; });
  return { coins: 0, stage: 1, owned };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through to default */ }
  }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

let puzzleTimer = null;
let puzzleTimeLeft = 0;
let puzzleActive = false;
let flippedCards = [];
let boardCards = [];
let lockBoard = false;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function emojiFor(id) {
  return ZODIAC.find(a => a.id === id).emoji;
}

function startPuzzle() {
  if (puzzleActive) return;
  const cfg = getStageConfig(state.stage);
  const ids = ZODIAC.slice(0, cfg.pairs).map(a => a.id);
  const deck = ids.concat(ids);
  shuffle(deck);
  boardCards = deck.map(id => ({ id, matched: false }));
  flippedCards = [];
  lockBoard = false;
  puzzleTimeLeft = cfg.time;
  puzzleActive = true;

  document.getElementById('puzzle-message').textContent = '';
  document.getElementById('puzzle-start-btn').disabled = true;
  renderBoard(cfg.pairs);
  updateTimerDisplay();

  clearInterval(puzzleTimer);
  puzzleTimer = setInterval(tickPuzzleTimer, 1000);
}

function tickPuzzleTimer() {
  puzzleTimeLeft--;
  updateTimerDisplay();
  if (puzzleTimeLeft <= 0) {
    failPuzzle();
  }
}

function updateTimerDisplay() {
  document.getElementById('puzzle-timer').textContent = puzzleTimeLeft;
}

function renderBoard(pairs) {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(pairs * 2));
  board.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
  boardCards.forEach((card, idx) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.index = String(idx);
    div.textContent = '❓';
    div.addEventListener('click', () => onCardClick(idx));
    board.appendChild(div);
  });
}

function onCardClick(idx) {
  if (!puzzleActive || lockBoard) return;
  const card = boardCards[idx];
  if (card.matched || flippedCards.includes(idx)) return;

  const cardEl = document.querySelector(`.card[data-index="${idx}"]`);
  cardEl.textContent = emojiFor(card.id);
  cardEl.classList.add('flipped');
  flippedCards.push(idx);

  if (flippedCards.length === 2) {
    lockBoard = true;
    const [a, b] = flippedCards;
    if (boardCards[a].id === boardCards[b].id) {
      boardCards[a].matched = true;
      boardCards[b].matched = true;
      document.querySelector(`.card[data-index="${a}"]`).classList.add('matched');
      document.querySelector(`.card[data-index="${b}"]`).classList.add('matched');
      flippedCards = [];
      lockBoard = false;
      checkPuzzleComplete();
    } else {
      setTimeout(() => {
        flippedCards.forEach(i => {
          const el = document.querySelector(`.card[data-index="${i}"]`);
          el.textContent = '❓';
          el.classList.remove('flipped');
        });
        flippedCards = [];
        lockBoard = false;
      }, 700);
    }
  }
}

function checkPuzzleComplete() {
  if (boardCards.every(c => c.matched)) {
    clearPuzzle();
  }
}

function clearPuzzle() {
  clearInterval(puzzleTimer);
  puzzleActive = false;
  const reward = BASE_REWARD + state.stage * REWARD_PER_STAGE + puzzleTimeLeft;
  state.coins += reward;
  state.stage += 1;
  saveState();

  renderCoins();
  renderShop();
  document.getElementById('puzzle-stage').textContent = state.stage;
  document.getElementById('puzzle-message').textContent = `클리어! +${reward} 코인 획득`;
  document.getElementById('puzzle-start-btn').disabled = false;
}

function failPuzzle() {
  clearInterval(puzzleTimer);
  puzzleActive = false;
  lockBoard = true;
  document.getElementById('puzzle-message').textContent = '시간 초과! 다시 도전하세요.';
  document.getElementById('puzzle-start-btn').disabled = false;
}

function renderCoins() {
  document.getElementById('coin-amount').textContent = state.coins;
}

function renderShop() {
  document.getElementById('gacha-cost').textContent = GACHA_COST;
  document.getElementById('purchase-cost').textContent = DIRECT_PURCHASE_COST;
  document.getElementById('gacha-btn').disabled = state.coins < GACHA_COST;
  renderPurchaseGrid();
}

function renderPurchaseGrid() {
  const grid = document.getElementById('purchase-grid');
  grid.innerHTML = '';
  ZODIAC.forEach(a => {
    const owned = state.owned[a.id];
    const div = document.createElement('div');
    div.className = 'animal-card' + (owned > 0 ? ' owned' : '');
    div.innerHTML = `<div class="emoji">${a.emoji}</div><div class="name">${a.name}</div>` +
      (owned > 0 ? `<div class="count">보유 x${owned}</div>` : '') +
      `<button data-id="${a.id}" ${state.coins < DIRECT_PURCHASE_COST ? 'disabled' : ''}>구매</button>`;
    grid.appendChild(div);
  });
  grid.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => purchaseAnimal(btn.dataset.id));
  });
}

function purchaseAnimal(id) {
  if (state.coins < DIRECT_PURCHASE_COST) return;
  state.coins -= DIRECT_PURCHASE_COST;
  state.owned[id] += 1;
  saveState();

  renderCoins();
  renderShop();
  renderCollection();
  checkWinCondition();
}

function pullGacha() {
  if (state.coins < GACHA_COST) return;
  state.coins -= GACHA_COST;
  const pick = ZODIAC[Math.floor(Math.random() * ZODIAC.length)];
  const wasOwned = state.owned[pick.id] > 0;
  state.owned[pick.id] += 1;
  saveState();

  renderCoins();
  renderShop();
  renderCollection();
  document.getElementById('gacha-result').textContent =
    `${pick.emoji} ${pick.name} 획득! ${wasOwned ? '(중복)' : '(NEW!)'}`;
  checkWinCondition();
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';
  let collected = 0;
  ZODIAC.forEach(a => {
    const owned = state.owned[a.id];
    if (owned > 0) collected++;
    const div = document.createElement('div');
    div.className = 'animal-card' + (owned > 0 ? ' owned' : '');
    div.innerHTML = `<div class="emoji">${owned > 0 ? a.emoji : '❔'}</div><div class="name">${a.name}</div>` +
      (owned > 0 ? `<div class="count">x${owned}</div>` : '');
    grid.appendChild(div);
  });
  document.getElementById('collection-progress').textContent = `(${collected}/12)`;
}

function checkWinCondition() {
  const collected = ZODIAC.filter(a => state.owned[a.id] > 0).length;
  if (collected >= 12) {
    document.getElementById('win-overlay').classList.remove('hidden');
  }
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'shop') renderShop();
      if (btn.dataset.tab === 'collection') renderCollection();
    });
  });
}

function renderAll() {
  renderCoins();
  document.getElementById('puzzle-stage').textContent = state.stage;
  document.getElementById('puzzle-timer').textContent = '--';
  renderShop();
  renderCollection();
  checkWinCondition();
}

document.getElementById('puzzle-start-btn').addEventListener('click', startPuzzle);
document.getElementById('gacha-btn').addEventListener('click', pullGacha);
document.getElementById('reset-btn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  document.getElementById('win-overlay').classList.add('hidden');
  renderAll();
});

setupTabs();
renderAll();
