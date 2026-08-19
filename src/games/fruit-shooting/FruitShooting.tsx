"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ClayShooting.module.css";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_DURATION_MS,
  SPAWN_INTERVAL_MS,
  PASS_THRESHOLD,
  type ClayTarget,
  createClayPair,
  stepTarget,
  isOffscreen,
  isHit,
  isPass,
} from "./engine";

type Phase = "ready" | "playing" | "cleared" | "failed";

export default function ClayShooting() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hitCount, setHitCount] = useState(0);
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);

  const phaseRef = useRef<Phase>("ready");
  const targetsRef = useRef<ClayTarget[]>([]);
  const nextIdRef = useRef(0);
  const hitCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  const resetGame = useCallback(() => {
    targetsRef.current = [];
    nextIdRef.current = 0;
    hitCountRef.current = 0;
    elapsedRef.current = 0;
    lastSpawnRef.current = 0;
    lastFrameTimeRef.current = null;
    setHitCount(0);
    setRemainingMs(GAME_DURATION_MS);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
  }, [resetGame]);

  const shootAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || phaseRef.current !== "playing") return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const pointX = (clientX - rect.left) * scaleX;
    const pointY = (clientY - rect.top) * scaleY;

    const targets = targetsRef.current;
    const hitIndex = targets.findIndex((target) =>
      isHit(target, pointX, pointY),
    );
    if (hitIndex === -1) return;

    targets.splice(hitIndex, 1);
    hitCountRef.current += 1;
    setHitCount(hitCountRef.current);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      shootAt(e.clientX, e.clientY);
    },
    [shootAt],
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

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

      for (const target of targetsRef.current) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#7c2d12";
        ctx.stroke();
      }
    };

    const step = (time: number) => {
      if (phaseRef.current !== "playing") {
        lastFrameTimeRef.current = null;
        draw();
        animationId = requestAnimationFrame(step);
        return;
      }

      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }
      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      elapsedRef.current += delta;
      setRemainingMs(Math.max(0, GAME_DURATION_MS - elapsedRef.current));

      if (elapsedRef.current - lastSpawnRef.current >= SPAWN_INTERVAL_MS) {
        lastSpawnRef.current += SPAWN_INTERVAL_MS;
        const pair = createClayPair(nextIdRef.current);
        nextIdRef.current += 2;
        targetsRef.current.push(...pair);
      }

      targetsRef.current = targetsRef.current
        .map(stepTarget)
        .filter((target) => !isOffscreen(target));

      if (elapsedRef.current >= GAME_DURATION_MS) {
        const cleared = isPass(hitCountRef.current);
        phaseRef.current = cleared ? "cleared" : "failed";
        setPhase(cleared ? "cleared" : "failed");
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>클레이 사격</h1>

      <div className={styles.hud}>
        <span>남은 시간: {remainingSeconds}초</span>
        <span>
          명중: {hitCount} / {PASS_THRESHOLD}
        </span>
      </div>

      <div className={styles.canvasBox}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
        />

        {phase === "ready" && (
          <div className={styles.overlay}>
            <p>
              화면을 클릭해서 날아오르는 클레이를 맞추세요.
              <br />
              60초 안에 {PASS_THRESHOLD}개 이상 명중하면 통과!
            </p>
            <button className={styles.button} onClick={startGame}>
              시작하기
            </button>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.overlay}>
            <p className={styles.result}>통과! 명중 {hitCount}개</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}

        {phase === "failed" && (
          <div className={styles.overlay}>
            <p className={styles.result}>실패. 명중 {hitCount}개</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
