"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BrickBreaker.module.css";

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
const POINTS_PER_BRICK = 10;
const INITIAL_PADDLE_X = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;

type Phase = "ready" | "playing" | "won" | "lost";

type Brick = { x: number; y: number; alive: boolean };

function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      bricks.push({
        x: BRICK_SIDE_OFFSET + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
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

export default function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);

  const phaseRef = useRef<Phase>("ready");
  const bricksRef = useRef<Brick[]>(createBricks());
  const paddleXRef = useRef(INITIAL_PADDLE_X);
  const ballRef = useRef(createBallOnPaddle(INITIAL_PADDLE_X));
  const keysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const scoreRef = useRef(0);
  const livesRef = useRef(STARTING_LIVES);

  const resetGame = useCallback(() => {
    bricksRef.current = createBricks();
    paddleXRef.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    ballRef.current = createBallOnPaddle(paddleXRef.current);
    scoreRef.current = 0;
    livesRef.current = STARTING_LIVES;
    setScore(0);
    setLives(STARTING_LIVES);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
  }, [resetGame]);

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

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(paddleXRef.current, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      const ball = ballRef.current;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
    };

    const step = () => {
      if (phaseRef.current !== "playing") {
        draw();
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

      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx *= -1;
      } else if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - BALL_RADIUS;
        ball.vx *= -1;
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy *= -1;
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
          scoreRef.current += POINTS_PER_BRICK;
          setScore(scoreRef.current);
          break;
        }
      }

      if (ball.y - BALL_RADIUS > CANVAS_HEIGHT) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          phaseRef.current = "lost";
          setPhase("lost");
        } else {
          ballRef.current = createBallOnPaddle(paddleXRef.current);
        }
      }

      if (bricksRef.current.every((b) => !b.alive)) {
        phaseRef.current = "won";
        setPhase("won");
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>벽돌깨기</h1>

      <div className={styles.hud}>
        <span>점수: {score}</span>
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

        {phase === "won" && (
          <div className={styles.overlay}>
            <p className={styles.result}>클리어! 점수 {score}</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}

        {phase === "lost" && (
          <div className={styles.overlay}>
            <p className={styles.result}>게임 오버. 점수 {score}</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
