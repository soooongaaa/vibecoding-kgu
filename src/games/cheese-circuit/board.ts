// 치즈 미로(회로 잇기) 판 생성과 전류 전파 로직.
// 렌더링과 무관한 순수 함수만 둔다.

export const NORTH = 1;
export const EAST = 2;
export const SOUTH = 4;
export const WEST = 8;

export const DIRECTIONS = [NORTH, EAST, SOUTH, WEST] as const;

const DELTA: Record<number, { dr: number; dc: number }> = {
  [NORTH]: { dr: -1, dc: 0 },
  [EAST]: { dr: 0, dc: 1 },
  [SOUTH]: { dr: 1, dc: 0 },
  [WEST]: { dr: 0, dc: -1 },
};

/** 비트마스크를 시계 방향으로 times번 90° 회전시킨다. */
export function rotate(mask: number, times = 1): number {
  const steps = ((times % 4) + 4) % 4;
  let out = mask & 0b1111;
  for (let i = 0; i < steps; i++) {
    out = ((out << 1) | (out >> 3)) & 0b1111;
  }
  return out;
}

function opposite(dir: number) {
  return rotate(dir, 2);
}

export type Cell = {
  /** 회전 0회일 때의 연결 방향. 화면에는 이 모양을 그리고 CSS로 돌린다. */
  baseMask: number;
  /** 배터리에서 치즈까지 이어지는 정답 방향. 0이면 전선이 없는 빈 칸. */
  solved: number;
};

export type Board = {
  cols: number;
  rows: number;
  cells: Cell[];
  /** 배터리 칸 인덱스 */
  source: number;
  /** 치즈 칸 인덱스 */
  target: number;
  /** 배터리에서 치즈까지의 정답 경로 */
  path: number[];
};

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function neighbors(index: number, cols: number, rows: number) {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: { index: number; dir: number }[] = [];
  for (const dir of DIRECTIONS) {
    const nr = r + DELTA[dir].dr;
    const nc = c + DELTA[dir].dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
    out.push({ index: nr * cols + nc, dir });
  }
  return out;
}

/**
 * 배터리에서 치즈까지 겹치지 않는 경로 하나를 무작위로 판다.
 * 격자는 항상 연결되어 있으므로 경로를 반드시 찾는다.
 */
function carvePath(cols: number, rows: number, source: number, target: number): number[] {
  const visited = new Set<number>([source]);
  const stack = [source];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    if (current === target) return [...stack];

    const options = shuffle(neighbors(current, cols, rows)).filter(
      (nb) => !visited.has(nb.index),
    );
    if (options.length === 0) {
      stack.pop();
      continue;
    }

    visited.add(options[0].index);
    stack.push(options[0].index);
  }

  return [source, target];
}

/**
 * 정답 경로에서 갈라져 나가는 짧은 곁가지를 붙인다.
 * 클리어하려면 이 곁가지까지 전부 이어야 하므로 판의 분량을 결정한다.
 */
function addDecoys(
  cells: Cell[],
  path: number[],
  cols: number,
  rows: number,
  used: Set<number>,
) {
  for (const index of path) {
    if (Math.random() > 0.4) continue;

    let current = index;
    const length = 1 + randomInt(2);
    for (let step = 0; step < length; step++) {
      const options = shuffle(neighbors(current, cols, rows)).filter(
        (nb) => !used.has(nb.index),
      );
      if (options.length === 0) break;

      const { index: next, dir } = options[0];
      cells[current].solved |= dir;
      cells[next].solved |= opposite(dir);
      used.add(next);
      current = next;
    }
  }
}

function buildSolvedCells(cols: number, rows: number, source: number, target: number) {
  const cells: Cell[] = Array.from({ length: cols * rows }, () => ({
    baseMask: 0,
    solved: 0,
  }));

  const path = carvePath(cols, rows, source, target);
  const used = new Set<number>(path);

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const link = neighbors(from, cols, rows).find((nb) => nb.index === to);
    if (!link) continue;
    cells[from].solved |= link.dir;
    cells[to].solved |= opposite(link.dir);
  }

  addDecoys(cells, path, cols, rows, used);

  return { cells, path };
}

/** 전선이 있는 칸을 무작위로 돌려 놓는다. */
function scramble(cells: Cell[]) {
  for (const cell of cells) {
    cell.baseMask = cell.solved === 0 ? 0 : rotate(cell.solved, randomInt(4));
  }
}

export function createBoard(cols: number, rows: number): Board {
  // 배터리는 왼쪽 아래, 치즈는 오른쪽 위에 고정한다.
  const source = (rows - 1) * cols;
  const target = cols - 1;

  const { cells, path } = buildSolvedCells(cols, rows, source, target);
  const board: Board = { cols, rows, cells, source, target, path };

  // 처음부터 전부 이어져 있으면 게임이 안 되므로 다시 섞는다.
  const zeroTurns = new Array(cells.length).fill(0);
  for (let attempt = 0; attempt < 30; attempt++) {
    scramble(cells);
    if (!isCleared(board, zeroTurns)) break;
  }

  return board;
}

/** 배터리에서 전류가 닿는 칸 집합. 양쪽 전선이 서로 마주 봐야 이어진다. */
export function poweredSet(board: Board, turns: number[]): Set<number> {
  const { cols, rows, cells, source } = board;
  const masks = cells.map((cell, i) => rotate(cell.baseMask, turns[i] ?? 0));

  const seen = new Set<number>();
  if (masks[source] === 0) return seen;

  seen.add(source);
  const queue = [source];

  while (queue.length > 0) {
    const current = queue.pop() as number;
    const r = Math.floor(current / cols);
    const c = current % cols;

    for (const dir of DIRECTIONS) {
      if ((masks[current] & dir) === 0) continue;

      const nr = r + DELTA[dir].dr;
      const nc = c + DELTA[dir].dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const next = nr * cols + nc;
      if (seen.has(next)) continue;
      if ((masks[next] & opposite(dir)) === 0) continue;

      seen.add(next);
      queue.push(next);
    }
  }

  return seen;
}

/** 전선이 있는 칸이 하나도 빠짐없이 전류를 받았는지. */
export function isCleared(board: Board, turns: number[]): boolean {
  const powered = poweredSet(board, turns);
  return board.cells.every((cell, index) => cell.solved === 0 || powered.has(index));
}

/** 전선이 있는 칸의 수. 진행도 표시에 쓴다. */
export function wireCount(board: Board): number {
  return board.cells.filter((cell) => cell.solved !== 0).length;
}

function minTurns(from: number, to: number) {
  for (let k = 0; k < 4; k++) {
    if (rotate(from, k) === to) return k;
  }
  return 0;
}

/** 전선을 전부 맞추는 데 필요한 최소 회전 횟수. */
export function parTurns(board: Board): number {
  return board.cells.reduce(
    (sum, cell) => sum + (cell.solved === 0 ? 0 : minTurns(cell.baseMask, cell.solved)),
    0,
  );
}
