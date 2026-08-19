// 투표 화면의 살아있는 3D 미리보기.
//
// 카드마다 캔버스를 따로 두면 WebGL 컨텍스트가 5개 더 생긴다.
// 그래서 화면 전체를 덮는 캔버스 하나만 쓰고,
// 각 카드 자리에 뷰포트를 잘라(scissor) 하나씩 그려 넣는다.
//
// 카드가 CSS 로 커지면 잘라내는 영역도 같이 커지므로
// 마우스를 올렸을 때 왁뿌가 함께 커지는 것처럼 보인다.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { makeStageObject, disposeObject } from './scene3d.js';

export class VotePreview {
  constructor(canvas) {
    this.cv = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;

    this.items = [];
    this.hover = -1;
    this.prevT = 0;
    this.env = this.makeEnv();

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.cv.style.width = window.innerWidth + 'px';
    this.cv.style.height = window.innerHeight + 'px';
  }

  makeEnv() {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 64;
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#f2ecff');
    g.addColorStop(1, '#cdbdea');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 64);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fillRect(0, 8, 128, 8);

    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  // slots: [{ stage, el }] - el 은 카드 안에서 왁뿌가 들어앉을 빈 자리
  mount(slots) {
    this.clear();
    for (const { stage, el } of slots) {
      const scene = new THREE.Scene();
      scene.environment = this.env;

      const hemi = new THREE.HemisphereLight(0xffffff, 0xc9b4ea, 0.75);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 1.7);
      key.position.set(2.4, 4, 4);
      scene.add(key);

      const obj = makeStageObject(stage);
      const holder = new THREE.Group();
      holder.add(obj);
      scene.add(holder);

      // 물체가 화면에 꽉 차게 카메라 거리를 자동으로 맞춘다
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      obj.position.sub(center);
      const radius = Math.max(size.x, size.y, size.z) * 0.5;

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      const dist = (radius / Math.sin((34 * Math.PI / 180) / 2)) * 0.82;
      camera.position.set(0, radius * 0.28, dist);
      camera.lookAt(0, 0, 0);

      this.items.push({ stage, el, scene, camera, holder, hemi, key, scale: 0.92, lit: 0.75 });
    }
  }

  setHover(i) { this.hover = i; }

  render(nowMs) {
    if (!this.items.length) return;
    const dt = Math.min(0.05, this.prevT ? (nowMs - this.prevT) / 1000 : 0.016);
    this.prevT = nowMs;

    const r = this.renderer;
    const H = this.cv.clientHeight;

    r.setScissorTest(false);
    r.clear();
    r.setScissorTest(true);

    this.items.forEach((it, i) => {
      const rect = it.el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      if (rect.bottom < 0 || rect.top > H) return;

      const on = i === this.hover;
      const anyHover = this.hover >= 0;

      // 올려두면 커지면서 밝아지고, 치우면 살짝 뒤로 물러나며 어두워진다
      const wantScale = on ? 1.06 : (anyHover ? 0.9 : 0.97);
      const wantLit = on ? 1.25 : (anyHover ? 0.62 : 0.9);
      it.scale += (wantScale - it.scale) * Math.min(1, dt * 9);
      it.lit += (wantLit - it.lit) * Math.min(1, dt * 9);

      it.holder.scale.setScalar(it.scale);
      it.holder.rotation.y += dt * (on ? 0.9 : 0.45);   // 계속 돈다
      it.holder.position.z = (it.scale - 1) * 0.8;      // 물러나는 느낌
      it.hemi.intensity = 0.75 * it.lit;
      it.key.intensity = 1.7 * it.lit;

      const x = rect.left;
      const y = H - rect.bottom;
      r.setViewport(x, y, rect.width, rect.height);
      r.setScissor(x, y, rect.width, rect.height);
      it.camera.aspect = rect.width / rect.height;
      it.camera.updateProjectionMatrix();
      r.render(it.scene, it.camera);
    });

    r.setScissorTest(false);
  }

  clear() {
    for (const it of this.items) {
      it.scene.traverse((o) => { if (o.isMesh) disposeObject(o); });
    }
    this.items = [];
    this.hover = -1;
  }

  dispose() {
    this.clear();
    window.removeEventListener('resize', this.onResize);
    this.env.dispose();
    this.renderer.dispose();
  }
}
