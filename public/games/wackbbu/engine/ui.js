// HUD - 로고, 왁뿌 이름, 레벨/게이지, 클리어 배너.

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.stageName = $('stageName');
    this.stageNameEn = $('stageNameEn');
    this.lv = $('lv');
    this.dots = $('dots');
    this.count = $('count');
    this.hint = $('hint');
    this.banner = $('banner');
  }

  // 스테이지 색을 HUD 전체에 입힌다
  applyTheme(stage) {
    document.documentElement.style.setProperty('--theme', stage.theme);
    document.documentElement.style.setProperty('--theme-deep', stage.themeDeep);
  }

  // 이름이 톡 튀어나오는 연출
  popName() {
    this.stageName.classList.remove('pop');
    void this.stageName.offsetWidth;
    this.stageName.classList.add('pop');
  }

  // 투표로 뽑힌 왁뿌를 마음껏 만지는 보너스. 목표 횟수가 없다.
  setBonus(stage) {
    this.applyTheme(stage);
    this.stageName.textContent = stage.name;
    this.stageNameEn.textContent = 'BONUS ROUND';
    this.lv.textContent = 'BONUS';
    this.dots.innerHTML = '';
    this.dots.classList.remove('many');
    this.count.textContent = '0회';
    this.hint.textContent = '마음껏 만져보세요';
    this.hint.classList.remove('gone');
    this.popName();
  }

  setBonusCount(n) {
    this.count.textContent = `${n}회`;
    if (n > 0) this.hint.classList.add('gone');
  }

  setStage(stage, index, total) {
    this.applyTheme(stage);

    this.stageName.textContent = stage.name;
    this.stageNameEn.textContent = stage.nameEn;
    this.lv.textContent = `LV.${index + 1}`;

    // 게이지 칸을 목표 횟수만큼 새로 만든다 (스테이지마다 목표가 다름).
    // 칸이 많으면 작게 줄여서 줄바꿈으로 감싼다.
    this.dots.innerHTML = '';
    this.dots.classList.toggle('many', stage.target > 10);
    for (let i = 0; i < stage.target; i++) {
      const d = document.createElement('i');
      this.dots.appendChild(d);
    }
    this.setProgress(0, stage.target);

    this.hint.textContent = stage.hint;
    this.hint.classList.remove('gone');
    this.popName();
  }

  setProgress(n, target) {
    this.count.textContent = `${n}/${target}`;
    const list = this.dots.children;
    for (let i = 0; i < list.length; i++) {
      list[i].classList.toggle('on', i < n);
    }
    if (n > 0) this.hint.classList.add('gone');
  }

  // 스테이지 클리어. 글자가 갈라지면서 나왔다가 사악 사라진다.
  showBanner(text, sub = '', hold = 1800) {
    const b = this.banner;
    b.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'banner-wrap';

    // 같은 글자를 두 겹 겹치고 위/아래로 잘라서 갈라지는 것처럼 보이게 한다
    for (const half of ['top', 'bottom']) {
      const layer = document.createElement('div');
      layer.className = `banner-half ${half}`;
      layer.textContent = text;
      wrap.appendChild(layer);
    }
    b.appendChild(wrap);

    if (sub) {
      const s = document.createElement('div');
      s.className = 'banner-sub';
      s.textContent = sub;
      b.appendChild(s);
    }

    b.classList.remove('out');
    b.classList.add('in');

    clearTimeout(this._bt);
    this._bt = setTimeout(() => {
      b.classList.remove('in');
      b.classList.add('out');
      setTimeout(() => { b.innerHTML = ''; b.classList.remove('out'); }, 700);
    }, hold);
  }

  hideHud(hide) {
    document.body.classList.toggle('hud-off', hide);
  }
}
