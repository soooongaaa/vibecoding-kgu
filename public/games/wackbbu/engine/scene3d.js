// Three.js 3D 월드.
//
// 왁뿌는 통짜 덩어리가 아니다. 두 겹이다.
//
//   ┌── 얇은 왁스 막 (녹인 양초). 딱딱하고 광택 있음. 이것만 벗겨진다.
//   │
//   ▼   ╭─────────╮
//       │ ▓▓▓▓▓▓▓ │ ◄── 속: 슬랑이(말랑이). 절대 안 깨진다.
//       ╰─────────╯     눌렸다 돌아올 뿐, 형태는 끝까지 유지.
//
// 그래서 치는 동작은 "격파"가 아니라 "껍질 벗기기"다.
// 왁스 막에 구멍이 뚫리면서 그 자리에 속살이 드러나고,
// 깔수록 남은 왁스가 줄어 소리도 콰작 → 눅진 으로 넘어간다.
// 왁스를 100% 벗겨내는 게 목표는 아니다. 정해진 횟수를 치면 클리어다.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const OBJ_Y = 1.15;

// 같은 왁뿌는 언제 열어도 똑같이 생겨야 한다.
// 그래서 겉모습을 만드는 난수는 전부 왁뿌 이름으로 고정한 씨앗에서 뽑는다.
// (물리처럼 매번 달라도 되는 것만 Math.random 을 쓴다)
function makeRng(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (rng, a, b) => a + rng() * (b - a);

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    this.camera.position.set(0, 1.95, 5.3);
    this.camera.lookAt(0, OBJ_Y + 0.08, 0);

    this.buildLights();
    this.buildRoom();
    this.buildEnv();

    this.holder = null;   // 속 + 왁스막을 함께 담는 그룹
    this.core = null;
    this.shell = null;
    this.skin = null;     // 왁스 표면 텍스처 (금이 여기 그려진다)
    this.mask = null;     // 왁스가 남아있는 영역 (알파맵)
    this.flakes = [];
    this.stage = null;
    this.hidden = false;
    this.done = false;
    this.hits = 0;

    this.wob = 0;         // 말랑거림 (스프링)
    this.wobV = 0;
    this.shake = 0;
    this.spin = 0;
    this.prevT = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // updateStyle 을 끄면 안 된다. 캔버스는 대체 요소라 CSS inset:0 만으로는
    // 늘어나지 않고, 레티나에서 실제 픽셀 수만큼(2배) 커진 채 잘린다.
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.fov = h > w ? 60 : 40;
    this.camera.updateProjectionMatrix();
  }

  buildLights() {
    // 조명을 세게 주면 파스텔이 전부 흰색으로 날아간다.
    // 로블록스 특유의 쨍한 색은 오히려 빛을 낮춰야 살아난다.
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xc9b4ea, 0.7);
    this.scene.add(this.hemi);

    this.key = new THREE.DirectionalLight(0xffffff, 1.55);
    this.key.position.set(3.4, 6.5, 4.2);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    const cam = this.key.shadow.camera;
    cam.left = -6; cam.right = 6; cam.top = 6; cam.bottom = -6;
    cam.near = 0.5; cam.far = 20;
    this.key.shadow.bias = -0.0015;
    this.scene.add(this.key);

    this.fill = new THREE.DirectionalLight(0xffe8f4, 0.4);
    this.fill.position.set(-4, 2.5, 2);
    this.scene.add(this.fill);
  }

  // 체크타일 방. 로블록스 실내 특유의 배경.
  buildRoom() {
    this.tileTex = checkerTexture('#ffffff', '#a893cc', 26);
    this.wallTex = checkerTexture('#ffffff', '#bcaadc', 18);

    const floorMat = new THREE.MeshStandardMaterial({ map: this.tileTex, roughness: 0.75 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floorMat = floorMat;

    const wallMat = new THREE.MeshStandardMaterial({
      map: this.wallTex, roughness: 0.9, side: THREE.BackSide,
    });
    const room = new THREE.Mesh(new THREE.BoxGeometry(40, 26, 40), wallMat);
    room.position.y = 12.9;
    this.scene.add(room);
    this.wallMat = wallMat;

    const padMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.14, 48), padMat);
    pad.position.y = 0.07;
    pad.receiveShadow = true;
    this.scene.add(pad);

    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffc24d });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.53, 0.05, 12, 64), this.ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.15;
    this.scene.add(ring);
  }

  // 왁스 광택에 비칠 환경. 그라데이션 캔버스를 환경맵으로 굽는다.
  buildEnv() {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#f0e8ff');
    g.addColorStop(1, '#c9b8e8');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fillRect(0, 18, 256, 14);

    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envMap = pmrem.fromEquirectangular(tex).texture;
    this.scene.environment = this.envMap;
    pmrem.dispose();
    tex.dispose();
  }

  // ── 스테이지 ───────────────────────────────────────────────────────────

  setStage(stage) {
    this.clearObject();
    this.stage = stage;
    this.done = false;
    this.hits = 0;
    this.wob = 0;
    this.wobV = 0;

    const bgA = new THREE.Color(stage.bg[0]);
    const bgB = new THREE.Color(stage.bg[1]);
    this.scene.background = bgB;
    this.hemi.color.set(bgA);
    this.hemi.groundColor.set(bgB);
    this.wallMat.color.set(bgA);
    this.floorMat.color.set(bgB);
    this.ringMat.color.set(stage.themeDeep);

    this.buildObject(stage);
  }

  // 속(슬랑이) + 왁스막 두 겹을 만든다
  buildObject(stage) {
    this.keys = null;

    // 키보드 스테이지는 깨는 게 아니라 눌러보는 곳이라 껍질이 없다
    if (stage.mode === 'press') {
      this.skin = new Skin(stage, null, 'solid');
      this.mask = null;
      this.holder = new THREE.Group();
      this.holder.position.y = OBJ_Y;
      const kb = buildKeyboard(stage, this.skin.texture);
      this.holder.add(kb.group);
      this.keys = kb.keys;
      this.core = null;
      this.shell = null;
      this.scene.add(this.holder);
      return;
    }

    this.skin = new Skin(stage);
    this.mask = new WaxMask(this.skin.W, this.skin.H, stage.id + '-chip');

    this.holder = new THREE.Group();
    this.holder.position.y = OBJ_Y;

    // 속 - 무광 스퀴시. 왁스 바로 밑에 붙어 있어야 한다.
    // 틈이 벌어지면 속이 텅 빈 유리구슬처럼 보인다.
    this.core = buildShape(stage, coreMaterial(stage), 0.96);
    this.holder.add(this.core);

    // 왁스막 - 광택. 알파맵으로 벗겨진 자리를 뚫는다.
    this.shell = buildShape(stage, shellMaterial(this.skin.texture, this.mask.texture), 1);
    this.holder.add(this.shell);

    this.scene.add(this.holder);
  }

  clearObject() {
    if (this.holder) { this.scene.remove(this.holder); disposeTree(this.holder); this.holder = null; }
    for (const f of this.flakes) { this.scene.remove(f.mesh); disposeTree(f.mesh); }
    this.flakes = [];
    if (this.skin) { this.skin.dispose(); this.skin = null; }
    if (this.mask) { this.mask.dispose(); this.mask = null; }
    this.core = this.shell = null;
    this.keys = null;
  }

  // 한 대 맞았을 때. 부수는 게 아니라 왁스 껍질을 벗겨내는 것.
  hit(strength) {
    if (!this.stage) return;
    this.hits++;
    const target = this.stage.target || 6;
    const ratio = Math.min(1, this.hits / target);

    // 키보드는 키캡 하나가 눌렸다 올라온다. 부서지지 않는다.
    if (this.keys) {
      // 무작위로 튀면 정신없다. 왼쪽 위부터 순서대로 눌린다.
      const k = this.keys[(this.hits - 1) % this.keys.length];
      k.press = 0.095 + strength * 0.045;
      k.vel = 0;
      this.wobV = Math.min(this.wobV + 1.2, 3);
      this.shake = 0.015 + strength * 0.025;
      return;
    }

    // 속이 말랑하게 눌렸다가 통통 돌아온다.
    // 연타로 흔들림이 무한정 쌓이면 물체가 납작해지므로 상한을 둔다.
    this.wobV = Math.min(this.wobV + 7 * (0.45 + strength * 0.6), 11);
    this.shake = 0.035 + strength * 0.07;

    if (this.skin && this.mask) {
      const at = this.skin.addCrack();
      // 벗겨지는 면적은 칠수록 조금씩 커진다
      const r = (0.07 + ratio * 0.04) * (0.8 + strength * 0.5);
      this.skin.rimMark(at.u, at.v, r);   // 구멍 둘레에 두께가 보이도록
      this.mask.chip(at.u, at.v, r);
      const rng = this.skin.rng;
      if (rng() < 0.5) {
        const u2 = at.u + rr(rng, -0.07, 0.07);
        const v2 = at.v + rr(rng, -0.07, 0.07);
        const r2 = r * rr(rng, 0.45, 0.75);
        this.skin.rimMark(u2, v2, r2);
        this.mask.chip(u2, v2, r2);
      }
    }

    this.spawnFlakes(3 + Math.floor(strength * 5));
  }

  // 클리어. 물체를 부수지 않는다.
  // 남은 왁스가 한 번 우수수 떨어지고 속 슬랑이는 그대로 통통 튄다.
  finish() {
    if (this.done) return;
    this.done = true;

    // 키보드는 마지막에 키들이 차례로 눌리며 훑고 지나간다
    if (this.keys) {
      this.keys.forEach((k, i) => {
        setTimeout(() => { k.press = 0.08; k.vel = 0; }, i * 45);
      });
      this.shake = 0.05;
      return;
    }

    this.wobV = Math.min(this.wobV + 13, 15);
    this.shake = 0.13;
    if (this.skin && this.mask) {
      for (let i = 0; i < 5; i++) {
        this.mask.chip(this.skin.originU + rnd(-0.14, 0.14), rnd(0.28, 0.72), rnd(0.06, 0.11));
      }
    }
    this.spawnFlakes(16);
  }

  // 떨어져 나가는 왁스 부스러기
  spawnFlakes(n) {
    // 떨어지는 건 왁스 부스러기다. 속살 색이 아니라 양초 색이어야 한다.
    const color = waxColor(this.stage);
    for (let i = 0; i < n; i++) {
      const geo = new THREE.TetrahedronGeometry(rnd(0.06, 0.15), 0);
      const mat = new THREE.MeshPhysicalMaterial({
        color, roughness: 0.2, metalness: 0, clearcoat: 0.9,
        clearcoatRoughness: 0.1, transparent: true, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.scale.set(rnd(0.9, 1.6), rnd(0.2, 0.4), rnd(0.9, 1.6)); // 얇은 조각

      const a = rnd(0, TAU);
      const e = rnd(-0.4, 0.9);
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
      mesh.position.copy(dir).multiplyScalar(rnd(0.7, 1.05)).add(new THREE.Vector3(0, OBJ_Y, 0));
      this.scene.add(mesh);

      this.flakes.push({
        mesh,
        vel: new THREE.Vector3(dir.x * rnd(1.2, 3.2), rnd(1.6, 4), dir.z * rnd(1.2, 3.2)),
        spin: new THREE.Vector3(rnd(-11, 11), rnd(-11, 11), rnd(-11, 11)),
        life: 1,
      });
    }
  }


  // ── 렌더 ───────────────────────────────────────────────────────────────

  render(nowMs) {
    const dt = Math.min(0.05, this.prevT ? (nowMs - this.prevT) / 1000 : 0.016);
    this.prevT = nowMs;

    if (this.holder) {
      this.holder.visible = !this.hidden;

      // 말랑거림 - 감쇠 스프링. 눌렸다가 살짝 넘어갔다 돌아온다.
      const k = 200, damp = 10.5;
      this.wobV += (-k * this.wob - damp * this.wobV) * dt;
      this.wob += this.wobV * dt;
      const w = Math.max(-0.45, Math.min(0.6, this.wob));

      this.holder.scale.set(1 + w * 0.24, 1 - w * 0.3, 1 + w * 0.24);
      this.holder.position.y = OBJ_Y - w * 0.1;

      this.spin += dt * 0.25;
      this.holder.rotation.y = Math.sin(this.spin) * 0.22;
    }

    // 키캡 - 눌렸다가 스프링으로 튀어 올라온다
    if (this.keys) {
      for (const k of this.keys) {
        k.vel += (-300 * k.press - 26 * k.vel) * dt;
        k.press += k.vel * dt;
        if (Math.abs(k.press) < 0.0005 && Math.abs(k.vel) < 0.006) { k.press = 0; k.vel = 0; }
        k.mesh.position.y = k.baseY - k.press;
      }
    }

    // 부스러기 물리
    for (let i = this.flakes.length - 1; i >= 0; i--) {
      const f = this.flakes[i];
      f.vel.y -= 11 * dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.mesh.rotation.x += f.spin.x * dt;
      f.mesh.rotation.y += f.spin.y * dt;
      f.mesh.rotation.z += f.spin.z * dt;
      if (f.mesh.position.y < 0.18) {
        f.mesh.position.y = 0.18;
        f.vel.y = Math.abs(f.vel.y) * 0.38;
        f.vel.x *= 0.66; f.vel.z *= 0.66;
        f.spin.multiplyScalar(0.7);
      }
      f.life -= dt * 0.6;
      f.mesh.material.opacity = Math.max(0, Math.min(1, f.life));
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        disposeTree(f.mesh);
        this.flakes.splice(i, 1);
      }
    }

    const sh = this.shake;
    this.camera.position.set(rnd(-sh, sh), 1.95 + rnd(-sh, sh), 5.3);
    this.camera.lookAt(0, OBJ_Y + 0.08, 0);
    this.shake *= Math.pow(0.0001, dt);

    this.renderer.render(this.scene, this.camera);
  }
}

// 투표 화면 미리보기용. 금 하나 없는 새 왁뿌를 한 덩어리로 만들어 준다.
// 본 게임의 재질·형태를 그대로 쓰므로 미리보기와 실물이 어긋나지 않는다.
export function makeStageObject(stage) {
  const g = new THREE.Group();

  if (stage.mode === 'press') {
    const skin = new Skin(stage, null, 'solid');
    g.add(buildKeyboard(stage, skin.texture).group);
    return g;
  }

  const skin = new Skin(stage);
  const mask = new WaxMask(skin.W, skin.H, stage.id + '-chip');
  g.add(buildShape(stage, coreMaterial(stage), 0.96));
  g.add(buildShape(stage, shellMaterial(skin.texture, mask.texture), 1));
  return g;
}

export function disposeObject(obj) { disposeTree(obj); }

// ── 왁스가 남아있는 영역 ──────────────────────────────────────────────────
// 흰색 = 왁스 있음, 지워진 곳 = 벗겨져서 속이 드러남.
// 이걸 alphaMap 으로 쓰면 왁스막에 실제로 구멍이 뚫린다.

class WaxMask {
  constructor(W, H, seed = 'chip') {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, W, H);
    this.cv = cv; this.c = c; this.W = W; this.H = H;
    this.rng = makeRng(seed);   // 떨어져 나가는 조각 모양도 고정
    this.texture = new THREE.CanvasTexture(cv);
  }

  // uv 위치의 왁스를 들쭉날쭉하게 뜯어낸다
  chip(u, v, r) {
    const { c, W, H } = this;
    const x = ((u % 1) + 1) % 1 * W;
    const y = Math.max(0, Math.min(1, v)) * H;
    const rad = r * Math.min(W, H);

    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    const rng = this.rng;
    const n = 9 + Math.floor(rng() * 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const d = rad * rr(rng, 0.5, 1.35);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
    c.fill();
    c.restore();

    this.texture.needsUpdate = true;
  }

  dispose() { this.texture.dispose(); }
}

// ── 왁스 표면 텍스처 + 금 ─────────────────────────────────────────────────

// 왁스는 양초다. 흰 반불투명이어야 하고, 색은 속살이 갖는다.
function waxColor(stage) {
  // 완전한 흰색으로 밀면 종이처럼 보인다. 제 색을 조금 남겨야 양초로 읽힌다.
  return new THREE.Color(stage.theme).lerp(new THREE.Color(0xffffff), 0.6);
}

// 속살 텍스처. 왁스를 벗기면 드러나는 진짜 알맹이라
// 여기가 그 왁뿌의 색을 온전히 갖는다.
function coreTexture(stage) {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const rng = makeRng(stage.id + '-core');

  const base = new THREE.Color(stage.theme).lerp(new THREE.Color(stage.themeDeep), 0.12);
  c.fillStyle = '#' + base.getHexString();
  c.fillRect(0, 0, S, S);

  // 말랑한 덩어리 특유의 뭉근한 얼룩
  for (let i = 0; i < 70; i++) {
    c.globalAlpha = rr(rng, 0.04, 0.11);
    c.fillStyle = rng() < 0.5 ? '#ffffff' : stage.themeDeep;
    c.beginPath();
    c.arc(rr(rng, 0, S), rr(rng, 0, S), rr(rng, 18, 100), 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;

  // 알맹이 장식은 겉껍질이 아니라 속에 있어야 한다
  if (stage.id === 'minto') {
    for (let i = 0; i < 130; i++) {
      c.globalAlpha = rr(rng, 0.45, 0.85);
      c.fillStyle = '#3a2a20';
      const w = rr(rng, 5, 16), h = rr(rng, 4, 9);
      c.save();
      c.translate(rr(rng, 0, S), rr(rng, 0, S));
      c.rotate(rr(rng, 0, TAU));
      c.fillRect(-w / 2, -h / 2, w, h);
      c.restore();
    }
  } else if (stage.id === 'tanghulu') {
    for (let i = 0; i < 110; i++) {
      c.globalAlpha = 0.6;
      c.fillStyle = '#fff2c9';
      c.beginPath();
      c.ellipse(rr(rng, 0, S), rr(rng, 0, S), 3, 5, rr(rng, 0, TAU), 0, TAU);
      c.fill();
    }
  } else if (stage.id === 'butter') {
    // 버터 스퀴시의 결
    for (let i = 0; i < 26; i++) {
      c.globalAlpha = rr(rng, 0.06, 0.14);
      c.fillStyle = '#fff6cc';
      c.fillRect(0, rr(rng, 0, S), S, rr(rng, 4, 16));
    }
  }
  c.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class Skin {
  constructor(stage, imageCanvas = null, variant = 'wax') {
    const cv = document.createElement('canvas');
    const c = cv.getContext('2d');
    this.cv = cv; this.c = c;
    this.stage = stage;
    this.nodes = [];   // 이미 갈라진 지점들. 다음 금은 여기서 뻗어나간다.
    this.count = 0;
    // 같은 왁뿌면 n번째 금은 항상 같은 자리에 같은 모양으로 간다
    this.rng = makeRng(stage.id + '-crack');

    if (imageCanvas) {
      // 사진 스테이지 - 텍스처를 사진 비율에 맞춘다.
      // 정사각형에 레터박스로 넣으면 평면에 입힐 때 사진이 늘어난다.
      const MAX = 1024;
      const ratio = imageCanvas.width / imageCanvas.height;
      cv.width = Math.max(2, Math.round(ratio >= 1 ? MAX : MAX * ratio));
      cv.height = Math.max(2, Math.round(ratio >= 1 ? MAX / ratio : MAX));
      c.drawImage(imageCanvas, 0, 0, cv.width, cv.height);
    } else {
      cv.width = 1024; cv.height = 1024;
      const S = 1024;
      // 'solid' 은 키캡처럼 왁스가 아닌 물체. 제 색을 그대로 쓴다.
      c.fillStyle = variant === 'solid' ? stage.theme : '#' + waxColor(stage).getHexString();
      c.fillRect(0, 0, S, S);
      // 은은한 얼룩으로 단색 플라스틱 느낌을 지운다
      const wrng = makeRng(stage.id + '-wax');
      for (let i = 0; i < 90; i++) {
        c.globalAlpha = rr(wrng, 0.03, 0.08);
        c.fillStyle = wrng() < 0.5 ? '#ffffff' : stage.themeDeep;
        c.beginPath();
        c.arc(rr(wrng, 0, S), rr(wrng, 0, S), rr(wrng, 20, 120), 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      decorate(c, S, stage);
    }

    this.W = cv.width;
    this.H = cv.height;
    this.S = Math.min(this.W, this.H);

    // 구에 텍스처를 감으면 가로 방향이 크게 압축된다.
    // 보정하지 않으면 금이 죄다 적도를 따라 가로 띠처럼 몰려 보인다.
    const round = stage.shape === 'ball' || stage.shape === 'cloud';
    this.xScale = round ? 0.45 : 1;
    // 구 텍스처에서 카메라를 향한 앞면은 u=0.25 부근이다.
    this.originU = round ? 0.25 : 0.5;

    this.texture = new THREE.CanvasTexture(cv);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  // 금이 하나의 균열망으로 자란다. 시작점을 uv 로 돌려준다.
  addCrack() {
    const { S } = this;
    this.count++;
    const grow = Math.min(1, this.count / 7);

    const rng = this.rng;
    let sx, sy;
    if (this.nodes.length && rng() < 0.7) {
      const n = this.nodes[Math.floor(rng() * this.nodes.length)];
      sx = n.x; sy = n.y;
    } else {
      const u = this.originU;
      sx = rr(rng, this.W * (u - 0.11), this.W * (u + 0.11));
      sy = rr(rng, this.H * 0.34, this.H * 0.66);
    }

    const main = this.walk(sx, sy, rr(rng, 0, TAU), rr(rng, S * 0.045, S * 0.09), 4 + Math.floor(rng() * 4));
    this.fissure(main, 6 + grow * 8);

    const branches = 1 + Math.floor(rng() * 2 + grow * 1.5);
    for (let b = 0; b < branches; b++) {
      const from = main[1 + Math.floor(rng() * (main.length - 1))];
      const br = this.walk(from.x, from.y, rr(rng, 0, TAU), rr(rng, S * 0.03, S * 0.06), 2 + Math.floor(rng() * 3));
      this.fissure(br, 4 + grow * 4);
    }

    this.texture.needsUpdate = true;
    return { u: sx / this.W, v: sy / this.H };
  }

  // 조각이 떨어져 나간 자리의 테두리.
  //
  // 예전엔 여기에 어두운 그늘을 칠했는데, 그러면 왁스를 "파낸" 자국처럼 보였다.
  // 갓 깨진 왁스 단면은 오히려 빛을 받아 하얗게 서기 때문에
  // 밝은 테두리를 둘러야 조각이 뜯겨 나간 것처럼 읽힌다.
  rimMark(u, v, r) {
    const { c, W, H } = this;
    const x = (((u % 1) + 1) % 1) * W;
    const y = Math.max(0, Math.min(1, v)) * H;
    const rad = r * Math.min(W, H);

    const g = c.createRadialGradient(x, y, rad * 0.85, x, y, rad * 1.5);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, rad * 1.5, 0, TAU);
    c.fill();
    this.texture.needsUpdate = true;
  }

  walk(sx, sy, ang, len, segs) {
    const pts = [{ x: sx, y: sy }];
    let x = sx, y = sy, a = ang;
    for (let i = 0; i < segs; i++) {
      a += rr(this.rng, -0.8, 0.8);
      x += Math.cos(a) * len * this.xScale;
      y += Math.sin(a) * len;
      pts.push({ x, y });
      if (i > 0) this.nodes.push({ x, y });
    }
    if (this.nodes.length > 60) this.nodes.splice(0, this.nodes.length - 60);
    return pts;
  }

  // 벌어진 틈. 끝으로 갈수록 가늘어져야 진짜 균열처럼 보인다.
  fissure(pts, w0) {
    const c = this.c;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const taper = 1 - (i - 1) / pts.length;
      const w = Math.max(1.5, w0 * taper);
      // 갈라진 단면이 빛을 받아 하얗게 선다
      c.strokeStyle = 'rgba(255,255,255,0.97)';
      c.lineWidth = w * 2.6;
      c.beginPath();
      c.moveTo(pts[i - 1].x, pts[i - 1].y);
      c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
      // 틈 안쪽. 검게 칠하면 파낸 자국처럼 보이므로 아주 옅은 회색만 남긴다.
      c.strokeStyle = 'rgba(168,148,182,0.3)';
      c.lineWidth = w * 0.55;
      c.beginPath();
      c.moveTo(pts[i - 1].x, pts[i - 1].y);
      c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
    }
  }

  dispose() { this.texture.dispose(); }
}

// 왁뿌별 표면 장식
function decorate(c, S, stage) {
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (stage.id === 'butter') {
    c.globalAlpha = 0.5;
    c.fillStyle = '#8a6410';
    c.font = `700 ${Math.floor(S * 0.1)}px Jua, sans-serif`;
    c.fillText('SALTED', S / 2, S * 0.33);
    c.font = `700 ${Math.floor(S * 0.19)}px Jua, sans-serif`;
    c.fillText('BUTTER', S / 2, S * 0.48);
    c.font = `700 ${Math.floor(S * 0.07)}px Jua, sans-serif`;
    c.fillText('NET WT. 4oz', S / 2, S * 0.62);
    c.globalAlpha = 1;
  } else if (stage.id === 'honey') {
    // 키보드 배열과 같은 4x3 격자. 칸 하나가 키캡 하나가 된다.
    const cols = 4, rows = 3;
    const cw = S / cols, ch = S / rows;
    const letters = 'QWERASDFZXCV';
    c.globalAlpha = 0.62;
    c.fillStyle = '#6b3f02';
    c.font = `700 ${Math.floor(Math.min(cw, ch) * 0.5)}px Jua, sans-serif`;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        c.fillText(letters[y * cols + x], (x + 0.5) * cw, (y + 0.5) * ch);
      }
    }
    c.globalAlpha = 1;
  }
  // 초코칩·딸기씨 같은 알맹이는 여기 없다. 그건 왁스가 아니라 속살의 것이라
  // coreTexture() 에서 그린다. 겉껍질은 흰 양초일 뿐이다.
}

// ── 재질 ─────────────────────────────────────────────────────────────────

// 왁스막 - 흰 반불투명 양초. 속색이 은은히 비쳐 보이고,
// 벗겨진 자리는 알파맵으로 뚫려서 속살이 그대로 드러난다.
function shellMaterial(skinTex, maskTex) {
  return new THREE.MeshPhysicalMaterial({
    map: skinTex,
    alphaMap: maskTex,
    alphaTest: 0.45,          // 뚫린 자리는 흐려지는 게 아니라 딱 잘려야 한다
    transparent: true,
    // 너무 비치면 유리구슬이 된다. 양초는 "살짝" 비치는 정도다.
    opacity: 0.9,
    depthWrite: true,
    side: THREE.DoubleSide,   // 구멍으로 껍질 안쪽 단면이 보인다
    // 거울처럼 매끈하면 유리, 뿌옇게 번지는 광이라야 왁스다
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
  });
}

// 속살 - 무광 스퀴시. 이 왁뿌의 진짜 색은 여기 있다.
// 겉이 흰 양초라서, 깰수록 색이 빠지는 게 아니라 오히려 진해진다.
function coreMaterial(stage) {
  return new THREE.MeshStandardMaterial({
    map: coreTexture(stage), roughness: 1, metalness: 0,
  });
}

// ── 형태 ─────────────────────────────────────────────────────────────────

function buildShape(stage, material, scale = 1) {
  const g = new THREE.Group();

  const add = (geo, pos = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(...pos);
    g.add(m);
    return m;
  };

  switch (stage.shape) {
    case 'block':
      add(roundedBox(1.95, 0.82, 0.88, 0.11));
      break;

    case 'keycap':
      add(roundedBox(1.35, 0.95, 1.35, 0.26));
      break;

    case 'ball':
      if (stage.id === 'tanghulu') {
        const stick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 2.9, 12),
          new THREE.MeshStandardMaterial({ color: 0xe8c98a, roughness: 0.8 })
        );
        stick.position.y = -0.55;
        stick.castShadow = true;
        g.add(stick);
        add(new THREE.SphereGeometry(0.5, 40, 28), [0, 0.62, 0]);
        add(new THREE.SphereGeometry(0.55, 40, 28), [0, 0.0, 0]);
        add(new THREE.SphereGeometry(0.49, 40, 28), [0, -0.6, 0]);
      } else {
        add(new THREE.SphereGeometry(0.95, 56, 36));
      }
      break;

    case 'cloud':
      add(new THREE.SphereGeometry(0.66, 36, 24), [-0.52, -0.04, 0]);
      add(new THREE.SphereGeometry(0.6, 36, 24), [0.56, -0.02, 0.08]);
      add(new THREE.SphereGeometry(0.8, 40, 28), [0, 0.18, 0]);
      add(new THREE.SphereGeometry(0.56, 36, 24), [-0.17, -0.27, 0.27]);
      add(new THREE.SphereGeometry(0.5, 36, 24), [0.24, -0.29, -0.24]);
      break;


    default:
      add(new THREE.SphereGeometry(0.95, 48, 32));
  }

  g.scale.setScalar(scale);
  return g;
}

// 키보드. 밑판 + 키캡 12개.
// 글자 텍스처를 격자로 잘라 키마다 한 글자씩 붙인다.
function buildKeyboard(stage, texture) {
  const group = new THREE.Group();
  const keys = [];

  const capMat = new THREE.MeshPhysicalMaterial({
    map: texture, roughness: 0.3, metalness: 0,
    clearcoat: 0.8, clearcoatRoughness: 0.12,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(stage.themeDeep), roughness: 0.62,
  });

  // roundedBox 는 XY 로 모양을 잡고 Z 로 뽑아낸다.
  // 글자 면이 위를 보게 하려면 눕혀야 한다.
  const base = roundedBox(2.05, 1.55, 0.3, 0.09);
  base.rotateX(-Math.PI / 2);
  const baseMesh = new THREE.Mesh(base, baseMat);
  baseMesh.position.y = -0.4;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const cols = 4, rows = 3;
  const step = 0.45, size = 0.37;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const geo = roundedBox(size, size, 0.26, 0.07);
      remapUVRect(geo, c / cols, (c + 1) / cols, 1 - (r + 1) / rows, 1 - r / rows);
      geo.rotateX(-Math.PI / 2);

      const m = new THREE.Mesh(geo, capMat);
      m.castShadow = true;
      m.receiveShadow = true;
      const baseY = -0.12;
      m.position.set((c - (cols - 1) / 2) * step, baseY, (r - (rows - 1) / 2) * step);
      group.add(m);
      keys.push({ mesh: m, baseY, press: 0, vel: 0 });
    }
  }

  // 키캡 윗면이 잘 보이도록 앞으로 살짝 눕힌다
  group.rotation.x = 0.34;
  group.scale.setScalar(1.15);
  return { group, keys };
}

function remapUVRect(geo, u0, u1, v0, v1) {
  const uv = geo.attributes.uv;
  if (!uv) return;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  uv.needsUpdate = true;
}

// 모서리 둥근 상자. 로블록스 오브젝트 특유의 부드러운 각.
function roundedBox(w, h, d, r) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const bevel = Math.min(0.09, r * 0.7);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geo.center();
  geo.computeVertexNormals();
  remapUV(geo);
  return geo;
}

// ExtrudeGeometry 는 UV 를 월드 좌표 그대로 뱉는다.
// 그대로 두면 표면 글자와 금이 엉뚱한 데 찍히므로 0~1 로 다시 편다.
function remapUV(geo) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const sx = bb.max.x - bb.min.x || 1;
  const sy = bb.max.y - bb.min.y || 1;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  if (!uv) return;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
  }
  uv.needsUpdate = true;
}

function checkerTexture(a, b, repeat) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  c.fillStyle = a; c.fillRect(0, 0, S, S);
  c.fillStyle = b;
  c.fillRect(0, 0, S / 2, S / 2);
  c.fillRect(S / 2, S / 2, S / 2, S / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

function disposeTree(obj) {
  obj.traverse?.((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose());
    }
  });
}
