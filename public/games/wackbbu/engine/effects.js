// 3D 위에 얹는 2D 오버레이 - 손 실루엣, 슈팅스타, 추임새 자막.

import { CONNECTIONS } from './hand.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

export class Overlay {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.stage = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.cv.width = Math.floor(this.w * dpr);
    this.cv.height = Math.floor(this.h * dpr);
    this.cv.style.width = this.w + 'px';
    this.cv.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setStage(stage) { this.stage = stage; }

  // 중앙에서 별이 사방으로 튀어나간다
  burstStars(n) {
    const cx = this.w / 2;
    const cy = this.h * 0.46;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU);
      const sp = rnd(3, 11);
      this.stars.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2,
        rot: rnd(0, TAU),
        vr: rnd(-0.25, 0.25),
        size: rnd(8, 22),
        life: 1,
        decay: rnd(0.012, 0.026),
        hue: Math.random() < 0.5 ? '#fff6b0' : '#ffffff',
      });
    }
  }

  draw(hands) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    this.drawStars(c);
    for (const h of hands) if (h.present && h.landmarks) this.drawHand(c, h);
  }

  drawStars(c) {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const st = this.stars[i];
      st.x += st.vx;
      st.y += st.vy;
      st.vy += 0.14;
      st.vx *= 0.985;
      st.rot += st.vr;
      st.life -= st.decay;
      if (st.life <= 0) { this.stars.splice(i, 1); continue; }

      c.save();
      c.translate(st.x, st.y);
      c.rotate(st.rot);
      c.globalAlpha = Math.max(0, st.life);
      c.shadowColor = '#fff';
      c.shadowBlur = 14;
      c.fillStyle = st.hue;
      star(c, st.size * (0.4 + st.life * 0.6));
      c.fill();
      c.restore();
    }
  }

  drawHand(c, hand) {
    const lm = hand.landmarks;
    const s = this.stage;
    const toX = (p) => (1 - p.x) * this.w; // 셀피라 좌우 반전
    const toY = (p) => p.y * this.h;

    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.shadowColor = s ? s.themeDeep : '#7a5cff';
    c.shadowBlur = 20;

    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 7;
    c.beginPath();
    for (const [a, b] of CONNECTIONS) {
      c.moveTo(toX(lm[a]), toY(lm[a]));
      c.lineTo(toX(lm[b]), toY(lm[b]));
    }
    c.stroke();

    c.shadowBlur = 12;
    c.fillStyle = s ? s.themeDeep : '#7a5cff';
    for (let i = 0; i < lm.length; i++) {
      const isTip = [4, 8, 12, 16, 20].includes(i);
      c.beginPath();
      c.arc(toX(lm[i]), toY(lm[i]), isTip ? 8 : 5, 0, TAU);
      c.fill();
    }
    c.restore();
  }
}

function star(c, r) {
  const spikes = 5;
  const inner = r * 0.45;
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (i / (spikes * 2)) * TAU - Math.PI / 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}

// ── 추임새 자막 ───────────────────────────────────────────────────────────
// 터진 자리에 작게 떠서 2초쯤 있다가 사악 사라진다.

export class Cheers {
  constructor(layer) {
    this.layer = layer;
    this.last = '';
  }

  pop(text, x, y, color) {
    this.last = text;
    const el = document.createElement('div');
    el.className = 'cheer';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--cheer-color', color || '#fff');
    el.style.setProperty('--drift', `${(Math.random() * 2 - 1) * 26}px`);
    el.style.setProperty('--tilt', `${(Math.random() * 2 - 1) * 10}deg`);
    this.layer.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  // 같은 말이 연달아 나오지 않게 고른다
  pick(list) {
    if (list.length < 2) return list[0];
    let t = list[Math.floor(Math.random() * list.length)];
    let guard = 0;
    while (t === this.last && guard++ < 6) {
      t = list[Math.floor(Math.random() * list.length)];
    }
    return t;
  }
}
