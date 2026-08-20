"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rescue } from "@/lib/rescue";
import styles from "./BrickBreaker.module.css";
import {
  sfxBrickBreak,
  sfxClear,
  sfxGameOver,
  sfxLifeLost,
  sfxPaddleHit,
  sfxWallBounce,
  startMusic,
  stopMusic,
} from "./sound";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const ROWS = 5;
const COLS = 8;
const BRICK_PADDING = 6;
const BRICK_TOP_OFFSET = 50;
const BRICK_SIDE_OFFSET = 20;
const BRICK_WIDTH =
  (CANVAS_WIDTH - BRICK_SIDE_OFFSET * 2 - BRICK_PADDING * (COLS - 1)) / COLS;
const BRICK_HEIGHT = 20;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = CANVAS_HEIGHT - 30;
const PADDLE_SPEED = 6;
const BALL_RADIUS = 7;
const BALL_SPEED = 4.5;
const STARTING_LIVES = 3;
const INITIAL_PADDLE_X = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
const CLEAR_BRICKS = Math.ceil((ROWS * COLS) / 2);
const BOARD_FILL = "#1e293b";
const TRAIL_LENGTH = 8;
const PADDLE_FLASH_MS = 150;

const ROW_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#38bdf8"];

type Phase = "ready" | "playing" | "cleared" | "lost";

type Brick = { x: number; y: number; alive: boolean; row: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      bricks.push({
        x: BRICK_SIDE_OFFSET + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
        row,
      });
    }
  }
  return bricks;
}

function createBallOnPaddle(paddleX: number) {
  return {
    x: paddleX + PADDLE_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS,
    vx: BALL_SPEED * 0.6,
    vy: -BALL_SPEED,
  };
}

function spawnParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1.5 + Math.random() * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
    });
  }
  return particles;
}

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");

  // 게임을 깨면 허브의 동물이 철창에서 풀려난다. 게임 로직은 건드리지 않는다.
  useEffect(() => {
    if (phase === "cleared") rescue("tiger");
  }, [phase]);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [muted, setMuted] = useState(false);

  const phaseRef = useRef<Phase>("ready");
  const bricksRef = useRef<Brick[]>(createBricks());
  const paddleXRef = useRef(INITIAL_PADDLE_X);
  const ballRef = useRef(createBallOnPaddle(INITIAL_PADDLE_X));
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const brokenRef = useRef(0);
  const livesRef = useRef(STARTING_LIVES);
  const clearedRef = useRef(false);
  const mutedRef = useRef(false);
  const paddleFlashUntilRef = useRef(0);

  const resetGame = useCallback(() => {
    bricksRef.current = createBricks();
    paddleXRef.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    ballRef.current = createBallOnPaddle(paddleXRef.current);
    trailRef.current = [];
    particlesRef.current = [];
    brokenRef.current = 0;
    livesRef.current = STARTING_LIVES;
    clearedRef.current = false;
    paddleFlashUntilRef.current = 0;
    setLives(STARTING_LIVES);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
    if (!mutedRef.current) startMusic();
  }, [resetGame]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) stopMusic();
    else if (phaseRef.current === "playing") startMusic();
  }, []);

  useEffect(() => {
    return () => stopMusic();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = true;
      if (e.key === "ArrowRight") keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keysRef.current.left = false;
      if (e.key === "ArrowRight") keysRef.current.right = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const movePaddleToPointer = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_WIDTH / rect.width;
    const canvasX = (clientX - rect.left) * scale;
    paddleXRef.current = Math.min(
      Math.max(canvasX - PADDLE_WIDTH / 2, 0),
      CANVAS_WIDTH - PADDLE_WIDTH,
    );
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      movePaddleToPointer(e.clientX);
    },
    [movePaddleToPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      movePaddleToPointer(e.clientX);
    },
    [movePaddleToPointer],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = BOARD_FILL;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        ctx.fillStyle = ROW_COLORS[brick.row % ROW_COLORS.length];
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }

      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        ctx.globalAlpha = ((i + 1) / trail.length) * 0.35;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const paddleFlashing = time < paddleFlashUntilRef.current;
      ctx.fillStyle = paddleFlashing ? "#e0f2fe" : "#38bdf8";
      ctx.fillRect(paddleXRef.current, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      const ball = ballRef.current;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
    };

    const step = (time: number) => {
      if (phaseRef.current !== "playing") {
        draw(time);
        animationId = requestAnimationFrame(step);
        return;
      }

      if (keysRef.current.left) {
        paddleXRef.current = Math.max(paddleXRef.current - PADDLE_SPEED, 0);
      }
      if (keysRef.current.right) {
        paddleXRef.current = Math.min(
          paddleXRef.current + PADDLE_SPEED,
          CANVAS_WIDTH - PADDLE_WIDTH,
        );
      }

      const ball = ballRef.current;
      ball.x += ball.vx;
      ball.y += ball.vy;

      trailRef.current.push({ x: ball.x, y: ball.y });
      if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();

      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.05,
        }))
        .filter((p) => p.life > 0);

      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx *= -1;
        if (!mutedRef.current) sfxWallBounce();
      } else if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - BALL_RADIUS;
        ball.vx *= -1;
        if (!mutedRef.current) sfxWallBounce();
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -1;
        if (!mutedRef.current) sfxWallBounce();
      }

      if (
        ball.vy > 0 &&
        ball.y + BALL_RADIUS >= PADDLE_Y &&
        ball.y + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
        ball.x >= paddleXRef.current &&
        ball.x <= paddleXRef.current + PADDLE_WIDTH
      ) {
        const hitPos =
          (ball.x - (paddleXRef.current + PADDLE_WIDTH / 2)) /
          (PADDLE_WIDTH / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        const angle = hitPos * (Math.PI / 3);
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
        ball.y = PADDLE_Y - BALL_RADIUS;
        paddleFlashUntilRef.current = time + PADDLE_FLASH_MS;
        if (!mutedRef.current) sfxPaddleHit();
      }

      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        if (
          ball.x + BALL_RADIUS > brick.x &&
          ball.x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
          ball.y + BALL_RADIUS > brick.y &&
          ball.y - BALL_RADIUS < brick.y + BRICK_HEIGHT
        ) {
          brick.alive = false;
          ball.vy *= -1;
          brokenRef.current += 1;
          if (!mutedRef.current) sfxBrickBreak();
          particlesRef.current.push(
            ...spawnParticles(
              brick.x + BRICK_WIDTH / 2,
              brick.y + BRICK_HEIGHT / 2,
              ROW_COLORS[brick.row % ROW_COLORS.length],
            ),
          );

          if (!clearedRef.current && brokenRef.current >= CLEAR_BRICKS) {
            clearedRef.current = true;
            phaseRef.current = "cleared";
            setPhase("cleared");
            stopMusic();
            if (!mutedRef.current) sfxClear();
          }
          break;
        }
      }

      if (
        phaseRef.current === "playing" &&
        ball.y - BALL_RADIUS > CANVAS_HEIGHT
      ) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          phaseRef.current = "lost";
          setPhase("lost");
          stopMusic();
          if (!mutedRef.current) sfxGameOver();
        } else {
          if (!mutedRef.current) sfxLifeLost();
          ballRef.current = createBallOnPaddle(paddleXRef.current);
          trailRef.current = [];
        }
      }

      draw(time);
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>벽돌깨기</h1>
        <button
          className={styles.muteButton}
          onClick={toggleMute}
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className={styles.hud}>
        <span>목숨: {lives}</span>
      </div>

      <div className={styles.canvasBox}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        />

        {phase === "ready" && (
          <div className={styles.overlay}>
            <p>← → 방향키 또는 화면을 눌러서 패들을 움직이세요</p>
            <button className={styles.button} onClick={startGame}>
              시작하기
            </button>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.clearOverlay}>
            <div className={styles.clearTitle}>CLEAR</div>
            <p className={styles.clearSubtext}>동물을 획득할 수 있어요!</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}

        {phase === "lost" && (
          <div className={styles.overlay}>
            <p className={styles.result}>게임 오버</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
