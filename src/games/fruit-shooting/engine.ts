export type FruitKind = "apple" | "orange" | "grape" | "strawberry" | "banana";

export type FruitTarget = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fruit: FruitKind;
};

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const GAME_DURATION_MS = 60_000;
export const SPAWN_INTERVAL_MS = 3_000;
export const PASS_THRESHOLD = 20;

const GRAVITY = 0.25;
const LAUNCH_VY = -13;
const LAUNCH_VX = 6;
const TARGET_RADIUS = 34;
const GROUND_Y = CANVAS_HEIGHT - 20;
const LEFT_SPAWN_X = 100;
const RIGHT_SPAWN_X = CANVAS_WIDTH - 100;
const REFERENCE_FRAME_MS = 1000 / 60;

const FRUIT_KINDS: FruitKind[] = [
  "apple",
  "orange",
  "grape",
  "strawberry",
  "banana",
];

function randomFruit(): FruitKind {
  return FRUIT_KINDS[Math.floor(Math.random() * FRUIT_KINDS.length)];
}

export function createFruitPair(): FruitTarget[] {
  return [
    {
      x: LEFT_SPAWN_X,
      y: GROUND_Y,
      vx: LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
      fruit: randomFruit(),
    },
    {
      x: RIGHT_SPAWN_X,
      y: GROUND_Y,
      vx: -LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
      fruit: randomFruit(),
    },
  ];
}

export function stepTarget(target: FruitTarget, deltaMs: number): FruitTarget {
  const dt = deltaMs / REFERENCE_FRAME_MS;
  return {
    ...target,
    x: target.x + target.vx * dt,
    y: target.y + target.vy * dt,
    vy: target.vy + GRAVITY * dt,
  };
}

export function isOffscreen(target: FruitTarget): boolean {
  return (
    target.y - target.radius > CANVAS_HEIGHT ||
    target.x + target.radius < 0 ||
    target.x - target.radius > CANVAS_WIDTH
  );
}

export function isHit(
  target: FruitTarget,
  pointX: number,
  pointY: number,
): boolean {
  const dx = target.x - pointX;
  const dy = target.y - pointY;
  return Math.sqrt(dx * dx + dy * dy) <= target.radius;
}

export function isPass(hitCount: number): boolean {
  return hitCount >= PASS_THRESHOLD;
}
