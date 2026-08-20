// HUD 조작. DOM 을 만지는 건 전부 여기 모아둔다.

import { SHAPES } from './gesture.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.el = {
      score: $('score'),
      myScore: $('myScore'),
      theirScore: $('theirScore'),
      roundLabel: $('roundLabel'),
      countdown: $('countdown'),
      myShape: $('myShape'),
      theirShape: $('theirShape'),
      myLabel: $('myLabel'),
      theirLabel: $('theirLabel'),
      banner: $('banner'),
      handBadge: $('handBadge'),
      hint: $('hint'),
      startOverlay: $('startOverlay'),
      startMsg: $('startMsg'),
      endOverlay: $('endOverlay'),
      endTitle: $('endTitle'),
      endDesc: $('endDesc'),
    };
  }

  setScore(wins, losses, round) {
    this.el.myScore.textContent = String(wins);
    this.el.theirScore.textContent = String(losses);
    this.el.roundLabel.textContent = `${round}번째 판`;
  }

  setHandVisible(visible) {
    this.el.handBadge.textContent = visible ? '손 인식 중' : '손이 안 보여요';
    this.el.handBadge.classList.toggle('off', !visible);
  }

  setHint(text) {
    this.el.hint.textContent = text || '';
    this.el.hint.classList.toggle('show', Boolean(text));
  }

  // 카운트다운 글자. 매번 애니메이션을 다시 태우려고 클래스를 껐다 켠다.
  showCount(text) {
    const el = this.el.countdown;
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  hideCount() {
    this.el.countdown.textContent = '';
    this.el.countdown.classList.remove('pop');
  }

  showShapes(mine, theirs) {
    this.el.myShape.textContent = mine ? SHAPES[mine].emoji : '❔';
    this.el.theirShape.textContent = theirs ? SHAPES[theirs].emoji : '❔';
    this.el.myLabel.textContent = mine ? SHAPES[mine].name : '';
    this.el.theirLabel.textContent = theirs ? SHAPES[theirs].name : '';
    document.body.classList.add('revealing');
  }

  clearShapes() {
    this.el.myShape.textContent = '';
    this.el.theirShape.textContent = '';
    this.el.myLabel.textContent = '';
    this.el.theirLabel.textContent = '';
    document.body.classList.remove('revealing');
  }

  showBanner(text, kind) {
    const el = this.el.banner;
    el.textContent = text;
    el.className = `show ${kind}`;
  }

  hideBanner() {
    this.el.banner.className = '';
  }

  setStartMsg(text) {
    this.el.startMsg.textContent = text;
  }

  hideStart() {
    this.el.startOverlay.classList.remove('show');
  }

  showEnd(won, wins, losses) {
    this.el.endTitle.textContent = won ? '이겼다!' : '졌다…';
    this.el.endDesc.textContent = `${wins} : ${losses} 로 ${won ? '아기돼지를 눌렀어요' : '아기돼지가 이겼어요'}`;
    this.el.endOverlay.classList.add('show');
  }

  hideEnd() {
    this.el.endOverlay.classList.remove('show');
  }
}
