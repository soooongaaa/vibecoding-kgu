# 쓰레기 피하기 드라이브 (obstacle-dodge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `feature/game-joyuni-b` 브랜치에 `/games/obstacle-dodge` 쓰레기 피하기 드라이빙 미니게임을 프론트엔드만으로 완성한다. 게임 로직은 이미 순수 HTML/CSS/JS 프로토타입으로 완성·검증되어 있으므로, 이 계획은 **그 로직을 그대로 Next.js 컴포넌트로 포팅**하는 작업이다 — 새로운 게임 설계가 아니다.

**Architecture:** `src/games/brick-breaker/`, `src/games/fruit-shooting/`와 동일한 패턴 — 순수 계산(차선 좌표, 장애물 스폰/이동, 충돌 판정, 난이도 보간)은 `engine.ts`로 분리하고, `ObstacleDodge.tsx`가 `requestAnimationFrame` 루프 안에서 그 함수들을 호출해 refs 기반 mutable 상태를 굴린다. HUD 표시용으로만 React state를 쓴다. 백엔드/DB는 없다.

**Tech Stack:** Next.js 16 (App Router, TypeScript), Canvas 2D API, CSS Modules, React 터치 이벤트(`onTouchStart`/`onTouchEnd`/`onTouchCancel`). 새 의존성 추가 없음.

**Spec:** `src/games/obstacle-dodge/SPEC.md`

## Global Constraints

- 캔버스 크기: 420×640, 도로 여백(ROAD_MARGIN) 40px, 차선 4개
- 제한시간: 30초 (`GAME_DURATION_SEC = 30`)
- 장애물 낙하 속도: 190 → 430 px/초로 시간에 따라 선형 증가
- 장애물 등장 간격: 1100ms → 480ms로 시간에 따라 선형 감소
- 한 프레임 최대 delta: 50ms로 clamp (탭 전환 시 시간 폭주 방지)
- 백엔드/API/Supabase 테이블: 만들지 않는다
- 자동화 테스트 프레임워크 없음 — fruit-shooting과 동일한 이유로 수동 검증(코드 read-through +
  `npm run lint`/`npm run build` + 로컬 실행)으로 대체한다.
- 수정 허용 범위: `src/games/obstacle-dodge/**`, `src/app/games/obstacle-dodge/**`만.
- 커밋은 작은 단위로, 태스크마다 1커밋.

---

### Task 1: `engine.ts` 순수 함수 (차선 계산, 장애물 스폰/이동, 충돌 판정, 난이도 보간)

**Files:**
- Create: `src/games/obstacle-dodge/engine.ts`

**Interfaces:**
- Produces: `ObstacleType`, `Obstacle` 타입, `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `LANE_COUNT`, `ROAD_MARGIN`, `ROAD_WIDTH`, `LANE_WIDTH`, `GAME_DURATION_SEC`, `CAR_WIDTH`, `CAR_HEIGHT`, `CAR_Y`, `START_LANE`, `OBSTACLE_WIDTH`, `OBSTACLE_HEIGHT`, `OBSTACLE_TYPES` 상수, `laneCenterX(laneIndex)`, `currentObstacleSpeed(elapsedSec)`, `currentSpawnIntervalMs(elapsedSec)`, `createObstacle()`, `isOffscreenBelow(obstacle)`, `rectsOverlap(ax,ay,aw,ah,bx,by,bw,bh)` — Task 3(`ObstacleDodge.tsx`)이 이 이름과 시그니처 그대로 소비한다.

- [ ] **Step 1: `engine.ts` 작성**

```ts
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
```

이 코드는 이미 검증된 순수 HTML/JS 프로토타입의 `CONFIG`/`spawnObstacle`/`rectsOverlap`/`lerp` 로직을 그대로 옮긴 것이다 (좌표·속도·간격 수치는 프로토타입과 완전히 동일).

- [ ] **Step 2: 수동 검증 (자동 테스트 러너 없음 — 코드를 읽으며 아래 값과 대조)**

  - `ROAD_WIDTH` = 420 - 40*2 = 340, `LANE_WIDTH` = 340/4 = 85
  - `laneCenterX(0)` = 40 + 85*0 + 42.5 = 82.5, `laneCenterX(3)` = 40 + 255 + 42.5 = 337.5 (도로 안쪽에 4개 차선이 고르게 들어맞는지 확인)
  - `START_LANE` = Math.floor(3/2) = 1
  - `currentObstacleSpeed(0)` = 190, `currentObstacleSpeed(30)` = 430, `currentObstacleSpeed(15)` = 310 (중간값)
  - `currentSpawnIntervalMs(0)` = 1100, `currentSpawnIntervalMs(30)` = 480
  - `isOffscreenBelow({y: 640+22, height:46, ...})` → 640+22-23=639 > 640? false 경계 확인: y=686 → 686-23=663>640 → true
  - `rectsOverlap(100,100,46,72, 100,100,46,46)` → dx=0<((46+46)/2=46) true, dy=0<((72+46)/2=59) true → true(겹침)

- [ ] **Step 3: 커밋**

```bash
git add src/games/obstacle-dodge/engine.ts
git commit -m "feat: obstacle-dodge 차선/장애물/충돌 순수함수 추가"
```

---

### Task 2: `ObstacleDodge.module.css`

**Files:**
- Create: `src/games/obstacle-dodge/ObstacleDodge.module.css`

**Interfaces:**
- Produces: CSS Module 클래스 `wrap`, `canvasBox`, `canvas`, `hud`, `hudTimeText`, `progressTrack`, `progressFill`, `overlay`, `title`, `bigResult`, `pass`, `fail`, `button` — Task 3이 `styles.<name>`으로 그대로 참조한다.

- [ ] **Step 1: CSS 작성 (검증된 프로토타입의 `<style>` 블록을 CSS Module 클래스명으로 옮김, 다른 게임들과 통일하기 위해 바깥 wrap 배경만 `#0f172a`로 맞춤 — 도로/차량 등 실제 게임 색상은 원본과 완전히 동일)**

```css
.wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: #0f172a;
  color: #f8fafc;
}

.canvasBox {
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 420 / 640;
  background: #0f172a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 5;
  pointer-events: none;
}

.hudTimeText {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.progressTrack {
  width: 100%;
  height: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.25);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: #facc15;
  border-radius: 6px;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 32px 24px;
  background: rgba(15, 23, 42, 0.92);
}

.title {
  margin: 0;
  font-size: 22px;
}

.overlay p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: #cbd5e1;
}

.bigResult {
  font-size: 64px;
  font-weight: 900;
  letter-spacing: 2px;
  margin: 0;
}

.bigResult.pass {
  color: #4ade80;
  text-shadow: 0 0 24px rgba(74, 222, 128, 0.6);
}

.bigResult.fail {
  color: #f87171;
  text-shadow: 0 0 24px rgba(248, 113, 113, 0.6);
}

.button {
  border: 0;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: #facc15;
  color: #1f2937;
  margin-top: 6px;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/obstacle-dodge/ObstacleDodge.module.css
git commit -m "style: obstacle-dodge CSS 모듈 추가"
```

---

### Task 3: `ObstacleDodge.tsx` 게임 본체

**Files:**
- Create: `src/games/obstacle-dodge/ObstacleDodge.tsx`

**Interfaces:**
- Consumes: Task 1의 `engine.ts` 전체 export, Task 2의 `ObstacleDodge.module.css` 클래스명
- Produces: `export default function ObstacleDodge()` — Task 4의 `page.tsx`가 `import ObstacleDodge from "@/games/obstacle-dodge/ObstacleDodge"`로 사용한다.

- [ ] **Step 1: 컴포넌트 작성 (검증된 프로토타입의 게임 로직을 refs 기반 React 컴포넌트로 포팅. 도로/차량/장애물 그리기 함수, 입력 처리, 충돌·타이머 로직은 원본과 동일하며, DOM 오버레이만 JSX 조건부 렌더링으로 바꿨다)**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ObstacleDodge.module.css";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LANE_COUNT,
  ROAD_MARGIN,
  ROAD_WIDTH,
  LANE_WIDTH,
  GAME_DURATION_SEC,
  CAR_WIDTH,
  CAR_HEIGHT,
  CAR_Y,
  START_LANE,
  type Obstacle,
  laneCenterX,
  currentObstacleSpeed,
  currentSpawnIntervalMs,
  createObstacle,
  isOffscreenBelow,
  rectsOverlap,
} from "./engine";

type Phase = "ready" | "playing" | "cleared" | "failed";

const CAR_COLOR = "#facc15";
const CAR_WINDOW_COLOR = "#1f2937";
const CAR_LANE_MOVE_SPEED = 14;

const ROAD_COLOR = "#3f3f46";
const GRASS_COLOR = "#22c55e";
const GRASS_STRIPE_COLOR = "#16a34a";
const CURB_COLOR = "#d4d4d8";
const LANE_LINE_COLOR = "rgba(248, 250, 252, 0.85)";
const LANE_DASH_LENGTH = 28;
const LANE_DASH_GAP = 22;

const SWIPE_THRESHOLD_PX = 30;
const MAX_FRAME_DELTA_MS = 50;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ObstacleDodge() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [remainingSeconds, setRemainingSeconds] = useState(GAME_DURATION_SEC);
  const [survivedSeconds, setSurvivedSeconds] = useState(0);

  const phaseRef = useRef<Phase>("ready");
  const laneIndexRef = useRef(START_LANE);
  const carXRef = useRef(laneCenterX(START_LANE));
  const obstaclesRef = useRef<Obstacle[]>([]);
  const elapsedSecRef = useRef(0);
  const lastSpawnAtMsRef = useRef(0);
  const roadScrollOffsetRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastEmittedSecondsRef = useRef(GAME_DURATION_SEC);
  const touchStartXRef = useRef<number | null>(null);

  const moveLane = useCallback((direction: 1 | -1) => {
    if (phaseRef.current !== "playing") return;
    const next = laneIndexRef.current + direction;
    if (next < 0 || next >= LANE_COUNT) return;
    laneIndexRef.current = next;
  }, []);

  const resetRound = useCallback(() => {
    laneIndexRef.current = START_LANE;
    carXRef.current = laneCenterX(START_LANE);
    obstaclesRef.current = [];
    elapsedSecRef.current = 0;
    lastSpawnAtMsRef.current = 0;
    roadScrollOffsetRef.current = 0;
    lastFrameTimeRef.current = null;
    lastEmittedSecondsRef.current = GAME_DURATION_SEC;
    setRemainingSeconds(GAME_DURATION_SEC);
  }, []);

  const startGame = useCallback(() => {
    resetRound();
    phaseRef.current = "playing";
    setPhase("playing");
  }, [resetRound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLane(-1);
      if (e.key === "ArrowRight") moveLane(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLane]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 0) return;
      touchStartXRef.current = e.touches[0].clientX;
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const startX = touchStartXRef.current;
      if (startX === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
        moveLane(deltaX > 0 ? 1 : -1);
      } else {
        const tapXInCanvas = endX - rect.left;
        moveLane(tapXInCanvas < rect.width / 2 ? -1 : 1);
      }
      touchStartXRef.current = null;
    },
    [moveLane],
  );

  const handleTouchCancel = useCallback(() => {
    touchStartXRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const drawRoad = () => {
      ctx.fillStyle = GRASS_COLOR;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = GRASS_STRIPE_COLOR;
      const stripeWidth = 10;
      for (let x = 0; x < ROAD_MARGIN; x += stripeWidth * 2) {
        ctx.fillRect(x, 0, stripeWidth, CANVAS_HEIGHT);
        ctx.fillRect(CANVAS_WIDTH - ROAD_MARGIN + x, 0, stripeWidth, CANVAS_HEIGHT);
      }

      ctx.fillStyle = ROAD_COLOR;
      ctx.fillRect(ROAD_MARGIN, 0, ROAD_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = CURB_COLOR;
      ctx.fillRect(ROAD_MARGIN - 4, 0, 4, CANVAS_HEIGHT);
      ctx.fillRect(ROAD_MARGIN + ROAD_WIDTH, 0, 4, CANVAS_HEIGHT);

      ctx.fillStyle = LANE_LINE_COLOR;
      const dashCycle = LANE_DASH_LENGTH + LANE_DASH_GAP;
      const startOffset = roadScrollOffsetRef.current % dashCycle;

      for (let laneIndex = 1; laneIndex < LANE_COUNT; laneIndex++) {
        const dividerX = ROAD_MARGIN + LANE_WIDTH * laneIndex;
        for (let y = -dashCycle + startOffset; y < CANVAS_HEIGHT; y += dashCycle) {
          ctx.fillRect(dividerX - 2, y, 4, LANE_DASH_LENGTH);
        }
      }
    };

    const drawCar = () => {
      const x = carXRef.current;
      const y = CAR_Y;
      const w = CAR_WIDTH;
      const h = CAR_HEIGHT;

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = CAR_COLOR;
      roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.fill();

      ctx.fillStyle = CAR_WINDOW_COLOR;
      roundRectPath(ctx, -w / 2 + 6, -h / 2 + 10, w - 12, h * 0.32, 6);
      ctx.fill();
      roundRectPath(ctx, -w / 2 + 8, h / 2 - h * 0.28, w - 16, h * 0.18, 5);
      ctx.fill();

      ctx.fillStyle = "#fff7ed";
      ctx.fillRect(-w / 2 + 4, -h / 2 + 2, 6, 5);
      ctx.fillRect(w / 2 - 10, -h / 2 + 2, 6, 5);

      ctx.restore();
    };

    const drawObstacle = (obstacle: Obstacle) => {
      const { x, y, width, height, type } = obstacle;
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = type.bodyColor;
      roundRectPath(ctx, -width / 2, -height / 2, width, height, 10);
      ctx.fill();

      ctx.strokeStyle = type.accentColor;
      ctx.lineWidth = 3;
      roundRectPath(ctx, -width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 8);
      ctx.stroke();

      ctx.font = `${Math.floor(height * 0.6)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(type.emoji, 0, 1);

      ctx.restore();
    };

    const draw = () => {
      drawRoad();
      for (const obstacle of obstaclesRef.current) drawObstacle(obstacle);
      drawCar();
    };

    const endRound = (didPass: boolean) => {
      setSurvivedSeconds(elapsedSecRef.current);
      phaseRef.current = didPass ? "cleared" : "failed";
      setPhase(didPass ? "cleared" : "failed");
    };

    const update = (deltaMs: number) => {
      const deltaSec = deltaMs / 1000;
      elapsedSecRef.current += deltaSec;

      const targetX = laneCenterX(laneIndexRef.current);
      carXRef.current +=
        (targetX - carXRef.current) * Math.min(1, CAR_LANE_MOVE_SPEED * deltaSec);

      const speed = currentObstacleSpeed(elapsedSecRef.current);
      roadScrollOffsetRef.current += speed * deltaSec;

      const elapsedMs = elapsedSecRef.current * 1000;
      if (
        elapsedMs - lastSpawnAtMsRef.current >=
        currentSpawnIntervalMs(elapsedSecRef.current)
      ) {
        lastSpawnAtMsRef.current = elapsedMs;
        obstaclesRef.current.push(createObstacle());
      }

      obstaclesRef.current = obstaclesRef.current.filter((obstacle) => {
        obstacle.y += speed * deltaSec;
        return !isOffscreenBelow(obstacle);
      });

      for (const obstacle of obstaclesRef.current) {
        if (
          rectsOverlap(
            carXRef.current, CAR_Y, CAR_WIDTH, CAR_HEIGHT,
            obstacle.x, obstacle.y, obstacle.width, obstacle.height,
          )
        ) {
          endRound(false);
          return;
        }
      }

      if (elapsedSecRef.current >= GAME_DURATION_SEC) {
        endRound(true);
        return;
      }

      const secondsLeft = Math.max(
        0,
        Math.ceil(GAME_DURATION_SEC - elapsedSecRef.current),
      );
      if (secondsLeft !== lastEmittedSecondsRef.current) {
        lastEmittedSecondsRef.current = secondsLeft;
        setRemainingSeconds(secondsLeft);
      }
    };

    const step = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }
      const rawDelta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;
      const deltaMs = Math.min(rawDelta, MAX_FRAME_DELTA_MS);

      if (phaseRef.current === "playing") {
        update(deltaMs);
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const progressRatio = Math.min(
    (GAME_DURATION_SEC - remainingSeconds) / GAME_DURATION_SEC,
    1,
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.canvasBox}>
        {phase === "playing" && (
          <div className={styles.hud}>
            <div className={styles.hudTimeText}>남은 시간: {remainingSeconds}초</div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${(1 - progressRatio) * 100}%` }}
              />
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        />

        {phase === "ready" && (
          <div className={styles.overlay}>
            <h1 className={styles.title}>🚗 쓰레기 피하기 드라이브</h1>
            <p>
              30초 동안 쓰레기를 피해 도로를 달리세요!
              <br />
              ← → 방향키 또는 화면 좌우 터치/스와이프로 차선을 바꿀 수 있어요.
            </p>
            <button className={styles.button} onClick={startGame}>
              시작하기
            </button>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.overlay}>
            <p className={`${styles.bigResult} ${styles.pass}`}>PASS</p>
            <p>무사히 도착했습니다!</p>
            <p>생존 시간: {survivedSeconds.toFixed(1)}초</p>
            <button className={styles.button} onClick={startGame}>
              다시하기
            </button>
          </div>
        )}

        {phase === "failed" && (
          <div className={styles.overlay}>
            <p className={`${styles.bigResult} ${styles.fail}`}>FAIL</p>
            <p>쓰레기와 충돌했습니다!</p>
            <p>{survivedSeconds.toFixed(1)}초 만에 충돌했습니다</p>
            <button className={styles.button} onClick={startGame}>
              다시하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/obstacle-dodge/ObstacleDodge.tsx
git commit -m "feat: obstacle-dodge 게임 컴포넌트 구현"
```

---

### Task 4: 라우트 진입 파일

**Files:**
- Create: `src/app/games/obstacle-dodge/page.tsx`

**Interfaces:**
- Consumes: Task 3의 `export default function ObstacleDodge()` (import 경로 `@/games/obstacle-dodge/ObstacleDodge`)

- [ ] **Step 1: `page.tsx` 작성 (`src/app/games/brick-breaker/page.tsx`, `src/app/games/fruit-shooting/page.tsx`와 동일 패턴)**

```tsx
import type { Metadata } from "next";
import ObstacleDodge from "@/games/obstacle-dodge/ObstacleDodge";

export const metadata: Metadata = {
  title: "쓰레기 피하기 드라이브 | Vibecoding KGU",
};

export default function ObstacleDodgePage() {
  return <ObstacleDodge />;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/games/obstacle-dodge/page.tsx
git commit -m "feat: obstacle-dodge 라우트 연결"
```

---

### Task 5: 검증 (lint, build, 수동 플레이)

**Files:** 없음 (검증만 수행)

- [ ] **Step 1: lint 실행**

Run: `npm run lint`
Expected: 에러 없이 통과.

- [ ] **Step 2: build 실행**

Run: `npm run build`
Expected: 타입 에러/빌드 에러 없이 성공하고, 라우트 목록에 `/games/obstacle-dodge`가 나온다.

- [ ] **Step 3: 로컬 실행 후 브라우저에서 직접 플레이**

Run: `npm run dev`, 브라우저에서 `http://localhost:3000/games/obstacle-dodge` 접속.

확인 항목:
- "시작하기" 클릭 → 4차선 도로, 아래로 흐르는 점선, 노란 차량, 상단 HUD(남은 시간/진행률 바)가 보이는지.
- ← → 방향키로 차선이 부드럽게 바뀌는지.
- 쓰레기가 무작위 차선에서 떨어지고, 시간이 지날수록 빨라지고 자주 나오는지.
- 쓰레기와 충돌하면 즉시 FAIL 화면(빨강) + 충돌까지 걸린 시간이 뜨는지.
- 30초를 버티면 PASS 화면(초록) + 생존 시간이 뜨는지.
- "다시하기" 클릭 시 완전히 초기화되고 재시작되는지.
- 브라우저 창을 좁게 줄이거나 모바일 에뮬레이션에서 좌/우 탭과 스와이프로도 차선이 바뀌는지.
- 콘솔에 에러가 없는지.

- [ ] **Step 4: 변경 범위 확인**

Run: `git diff origin/dev --stat`
Expected: `src/games/obstacle-dodge/`와 `src/app/games/obstacle-dodge/` 아래 파일만 나와야 한다.

## 완료 후

이 계획의 모든 태스크가 끝나면 `feature/game-joyuni-b`에는 커밋된 변경사항만 있고 아직 push되지 않은 상태다. `dev`로의 PR 생성·push는 사용자에게 변경 요약과 테스트 결과를 보여주고 명시적 승인을 받은 뒤에만 진행한다.
