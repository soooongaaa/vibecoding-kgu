// 웹캠 위에 손 뼈대를 얹는 2D 오버레이.
// 왁뿌숭 effects.js 를 가위바위보에 필요한 만큼만 줄여서 가져왔다.

// MediaPipe 손 랜드마크 연결 정보
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export class Overlay {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  resize() {
    // 캔버스는 대체 요소라 CSS 크기와 버퍼 크기를 따로 맞춰줘야 한다.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.cv.width = this.w * dpr;
    this.cv.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  // landmarks 는 0~1 정규화 좌표. 웹캠을 거울로 보여주므로 x 를 뒤집는다.
  drawHand(landmarks, color) {
    if (!landmarks) return;
    const ctx = this.ctx;
    const pt = (lm) => ({ x: (1 - lm.x) * this.w, y: lm.y * this.h });

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 웹캠 영상을 감춰 두었으므로 손이 유일한 시각 신호다.
    // 어두운 배경에서 떠 보이도록 글로우를 깔아준다.
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;

    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 10;
    for (const [a, b] of CONNECTIONS) {
      const p = pt(landmarks[a]);
      const q = pt(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (const [a, b] of CONNECTIONS) {
      const p = pt(landmarks[a]);
      const q = pt(landmarks[b]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    for (const lm of landmarks) {
      const p = pt(lm);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
  }
}
