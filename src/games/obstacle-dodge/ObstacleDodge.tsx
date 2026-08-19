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
