export type ObstacleType = {
  name: string;
  bodyColor: string;
  accentColor: string;
  emoji: string;
};

export type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
};

export const CANVAS_WIDTH = 420;
export const CANVAS_HEIGHT = 640;
export const LANE_COUNT = 4;
export const ROAD_MARGIN = 40;
export const GAME_DURATION_SEC = 30;

export const CAR_WIDTH = 46;
export const CAR_HEIGHT = 72;
const CAR_BOTTOM_OFFSET = 120;

export const OBSTACLE_WIDTH = 46;
export const OBSTACLE_HEIGHT = 46;

const OBSTACLE_SPEED_START = 190;
const OBSTACLE_SPEED_END = 430;
const OBSTACLE_SPAWN_INTERVAL_START = 1100;
const OBSTACLE_SPAWN_INTERVAL_END = 480;

export const ROAD_WIDTH = CANVAS_WIDTH - ROAD_MARGIN * 2;
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
export const CAR_Y = CANVAS_HEIGHT - CAR_BOTTOM_OFFSET;
export const START_LANE = Math.floor((LANE_COUNT - 1) / 2);

export const OBSTACLE_TYPES: ObstacleType[] = [
  { name: "trashbag", bodyColor: "#27272a", accentColor: "#52525b", emoji: "🗑️" },
  { name: "box", bodyColor: "#92400e", accentColor: "#78350f", emoji: "📦" },
  { name: "tire", bodyColor: "#18181b", accentColor: "#71717a", emoji: "🛞" },
];

export function laneCenterX(laneIndex: number): number {
  return ROAD_MARGIN + LANE_WIDTH * laneIndex + LANE_WIDTH / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function currentObstacleSpeed(elapsedSec: number): number {
  const t = Math.min(elapsedSec / GAME_DURATION_SEC, 1);
  return lerp(OBSTACLE_SPEED_START, OBSTACLE_SPEED_END, t);
}

export function currentSpawnIntervalMs(elapsedSec: number): number {
  const t = Math.min(elapsedSec / GAME_DURATION_SEC, 1);
  return lerp(OBSTACLE_SPAWN_INTERVAL_START, OBSTACLE_SPAWN_INTERVAL_END, t);
}

export function createObstacle(): Obstacle {
  const laneIndex = Math.floor(Math.random() * LANE_COUNT);
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  return {
    x: laneCenterX(laneIndex),
    y: -OBSTACLE_HEIGHT,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    type,
  };
}

export function isOffscreenBelow(obstacle: Obstacle): boolean {
  return obstacle.y - obstacle.height / 2 > CANVAS_HEIGHT;
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return (
    Math.abs(ax - bx) < (aw + bw) / 2 &&
    Math.abs(ay - by) < (ah + bh) / 2
  );
}
