// 가위바위보 판정과 3판 2선승 진행 상태.
// DOM 도 오디오도 모르는 순수 로직이라 따로 떼어 두었다.

const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

export const WIN_TARGET = 2;

// 'win' | 'lose' | 'draw'
export function judge(mine, theirs) {
  if (mine === theirs) return 'draw';
  return BEATS[mine] === theirs ? 'win' : 'lose';
}

export function randomShape() {
  const keys = ['rock', 'scissors', 'paper'];
  return keys[Math.floor(Math.random() * keys.length)];
}

export class Match {
  constructor() {
    this.reset();
  }

  reset() {
    this.wins = 0;
    this.losses = 0;
    this.round = 1;
    this.history = [];
  }

  // 무승부는 판수에 넣지 않는다. 같은 라운드를 다시 친다.
  record(outcome) {
    if (outcome === 'win') this.wins += 1;
    else if (outcome === 'lose') this.losses += 1;

    this.history.push(outcome);
    if (outcome !== 'draw') this.round += 1;

    return this.finished;
  }

  get finished() {
    return this.wins >= WIN_TARGET || this.losses >= WIN_TARGET;
  }

  get won() {
    return this.wins >= WIN_TARGET;
  }
}
