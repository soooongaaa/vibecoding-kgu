export type ClayTarget = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const GAME_DURATION_MS = 60_000;
export const SPAWN_INTERVAL_MS = 3_000;
export const PASS_THRESHOLD = 20;

const GRAVITY = 0.25;
const LAUNCH_VY = -13;
const LAUNCH_VX = 6;
const TARGET_RADIUS = 24;
const GROUND_Y = CANVAS_HEIGHT - 20;
const LEFT_SPAWN_X = 100;
const RIGHT_SPAWN_X = CANVAS_WIDTH - 100;

export function createClayPair(nextId: number): ClayTarget[] {
  return [
    {
      id: nextId,
      x: LEFT_SPAWN_X,
      y: GROUND_Y,
      vx: LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
    },
    {
      id: nextId + 1,
      x: RIGHT_SPAWN_X,
      y: GROUND_Y,
      vx: -LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
    },
  ];
}

export function stepTarget(target: ClayTarget): ClayTarget {
  return {
    ...target,
    x: target.x + target.vx,
    y: target.y + target.vy,
    vy: target.vy + GRAVITY,
  };
}

export function isOffscreen(target: ClayTarget): boolean {
  return (
    target.y - target.radius > CANVAS_HEIGHT ||
    target.x + target.radius < 0 ||
    target.x - target.radius > CANVAS_WIDTH
  );
}

export function isHit(
  target: ClayTarget,
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
