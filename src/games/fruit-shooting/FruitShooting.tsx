"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FruitShooting.module.css";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_DURATION_MS,
  SPAWN_INTERVAL_MS,
  PASS_THRESHOLD,
  type FruitKind,
  type FruitTarget,
  createFruitPair,
  stepTarget,
  isOffscreen,
  isHit,
  isPass,
} from "./engine";

type Phase = "ready" | "playing" | "cleared" | "failed";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

const FRAME_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 100;
const PARTICLES_PER_HIT = 6;
const PARTICLE_LIFE_DECAY_PER_FRAME = 0.04;

const FRUIT_EMOJI: Record<FruitKind, string> = {
  apple: "🍎",
  orange: "🍊",
  grape: "🍇",
  strawberry: "🍓",
  banana: "🍌",
};

const FRUIT_JUICE_COLOR: Record<FruitKind, string> = {
  apple: "#ef4444",
  orange: "#f97316",
  grape: "#a855f7",
  strawberry: "#f43f5e",
  banana: "#facc15",
};

function spawnParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLES_PER_HIT; i++) {
    const angle = (i / PARTICLES_PER_HIT) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 2;
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

function getAudioContext(ref: { current: AudioContext | null }): AudioContext {
  if (!ref.current) {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ref.current = new AudioContextConstructor();
  }
  if (ref.current.state === "suspended") {
    void ref.current.resume();
  }
  return ref.current;
}

function playPopSound(ctx: AudioContext) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.12);
}

export default function FruitShooting() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hitCount, setHitCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(GAME_DURATION_MS / 1000),
  );

  const phaseRef = useRef<Phase>("ready");
  const targetsRef = useRef<FruitTarget[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const hitCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastSpawnRef = useRef(-SPAWN_INTERVAL_MS);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastEmittedSecondsRef = useRef(Math.ceil(GAME_DURATION_MS / 1000));
  const audioContextRef = useRef<AudioContext | null>(null);

  const resetGame = useCallback(() => {
    targetsRef.current = [];
    particlesRef.current = [];
    hitCountRef.current = 0;
    elapsedRef.current = 0;
    lastSpawnRef.current = -SPAWN_INTERVAL_MS;
    lastFrameTimeRef.current = null;
    lastEmittedSecondsRef.current = Math.ceil(GAME_DURATION_MS / 1000);
    setHitCount(0);
    setRemainingSeconds(Math.ceil(GAME_DURATION_MS / 1000));
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

    const [hitTarget] = targets.splice(hitIndex, 1);
    particlesRef.current.push(
      ...spawnParticles(
        hitTarget.x,
        hitTarget.y,
        FRUIT_JUICE_COLOR[hitTarget.fruit],
      ),
    );
    playPopSound(getAudioContext(audioContextRef));
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
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

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

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const target of targetsRef.current) {
        ctx.font = `${target.radius * 2}px sans-serif`;
        ctx.fillText(FRUIT_EMOJI[target.fruit], target.x, target.y);
      }

      for (const particle of particlesRef.current) {
        ctx.globalAlpha = Math.max(particle.life, 0);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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
      const delta = Math.min(
        time - lastFrameTimeRef.current,
        MAX_FRAME_DELTA_MS,
      );
      lastFrameTimeRef.current = time;
      const dt = delta / FRAME_MS;

      elapsedRef.current += delta;

      const secondsLeft = Math.max(
        0,
        Math.ceil((GAME_DURATION_MS - elapsedRef.current) / 1000),
      );
      if (secondsLeft !== lastEmittedSecondsRef.current) {
        lastEmittedSecondsRef.current = secondsLeft;
        setRemainingSeconds(secondsLeft);
      }

      if (
        elapsedRef.current < GAME_DURATION_MS &&
        elapsedRef.current - lastSpawnRef.current >= SPAWN_INTERVAL_MS
      ) {
        lastSpawnRef.current += SPAWN_INTERVAL_MS;
        targetsRef.current.push(...createFruitPair());
      }

      targetsRef.current = targetsRef.current
        .map((target) => stepTarget(target, delta))
        .filter((target) => !isOffscreen(target));

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          life: particle.life - PARTICLE_LIFE_DECAY_PER_FRAME * dt,
        }))
        .filter((particle) => particle.life > 0);

      if (elapsedRef.current >= GAME_DURATION_MS) {
        const cleared = isPass(hitCountRef.current);
        targetsRef.current = [];
        particlesRef.current = [];
        phaseRef.current = cleared ? "cleared" : "failed";
        setPhase(cleared ? "cleared" : "failed");
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>과일 사격</h1>

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
              칼 커서로 날아오르는 과일을 클릭해서 터뜨리세요.
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
