"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rescue } from "@/lib/rescue";
import RescueBanner from "@/components/game/RescueBanner";
import styles from "./WhackAMole.module.css";

const HOLE_COUNT = 9;
const GAME_DURATION_MS = 30000;
const MOLE_MIN_VISIBLE_MS = 500;
const MOLE_MAX_VISIBLE_MS = 1100;
const GAP_MIN_MS = 150;
const GAP_MAX_MS = 450;

type Phase = "idle" | "playing" | "finished";

function getGrade(score: number) {
  if (score >= 20) return { label: "두더지 잡기 달인", emoji: "🏆" };
  if (score >= 12) return { label: "제법 빠른 손", emoji: "🎯" };
  if (score >= 6) return { label: "그럭저럭 잡았어요", emoji: "🙂" };
  return { label: "다음엔 더 잘할 거예요", emoji: "🐌" };
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function WhackAMole() {
  const [phase, setPhase] = useState<Phase>("idle");

  // 게임을 깨면 허브의 동물이 철창에서 풀려난다. 게임 로직은 건드리지 않는다.
  useEffect(() => {
    if (phase === "finished") rescue("rabbit");
  }, [phase]);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const lastHoleRef = useRef<number | null>(null);

  // Reassigned every render so the recursive timers below always call the
  // latest logic without needing a fragile mutual useCallback dependency.
  const loopRef = useRef<{ spawnMole: () => void; scheduleNext: () => void }>({
    spawnMole: () => {},
    scheduleNext: () => {},
  });

  useEffect(() => {
    loopRef.current.spawnMole = () => {
      let hole = randomInt(HOLE_COUNT);
      if (hole === lastHoleRef.current) {
        hole = (hole + 1) % HOLE_COUNT;
      }
      lastHoleRef.current = hole;
      setActiveHole(hole);

      const elapsedRatio = Math.min(1, (performance.now() - startedAtRef.current) / GAME_DURATION_MS);
      const visibleMs =
        MOLE_MIN_VISIBLE_MS + (MOLE_MAX_VISIBLE_MS - MOLE_MIN_VISIBLE_MS) * (1 - elapsedRatio);

      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        setActiveHole((current) => (current === hole ? null : current));
        setMisses((prev) => prev + 1);
        loopRef.current.scheduleNext();
      }, visibleMs);
    };

    loopRef.current.scheduleNext = () => {
      if (performance.now() - startedAtRef.current >= GAME_DURATION_MS) return;
      const gap = randomBetween(GAP_MIN_MS, GAP_MAX_MS);
      gapTimerRef.current = setTimeout(() => {
        gapTimerRef.current = null;
        loopRef.current.spawnMole();
      }, gap);
    };
  });

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (gapTimerRef.current !== null) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startGame = useCallback(() => {
    clearTimers();
    setScore(0);
    setMisses(0);
    setActiveHole(null);
    setRemainingMs(GAME_DURATION_MS);
    lastHoleRef.current = null;
    startedAtRef.current = performance.now();
    setPhase("playing");

    loopRef.current.spawnMole();

    countdownRef.current = setInterval(() => {
      const left = Math.max(0, GAME_DURATION_MS - (performance.now() - startedAtRef.current));
      setRemainingMs(left);
      if (left <= 0) {
        clearTimers();
        setActiveHole(null);
        setPhase("finished");
      }
    }, 100);
  }, [clearTimers]);

  const handleHoleClick = useCallback(
    (index: number) => {
      if (phase !== "playing" || activeHole !== index) return;
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setScore((prev) => prev + 1);
      setActiveHole(null);
      loopRef.current.scheduleNext();
    },
    [phase, activeHole],
  );

  const grade = getGrade(score);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>🔨 두더지 잡기</h1>
        {phase === "playing" && <span className={styles.timeBadge}>{remainingSeconds}초</span>}
      </header>

      {phase === "idle" && (
        <section className={styles.card}>
          <p>
            구멍에서 튀어나오는 두더지를 최대한 빠르게 클릭하세요.
            <br />
            제한시간 {GAME_DURATION_MS / 1000}초 동안 최대한 많이 잡아보세요!
          </p>
          <button type="button" className={styles.button} onClick={startGame}>
            시작하기
          </button>
        </section>
      )}

      {phase === "playing" && (
        <>
          <p className={styles.scoreLine}>
            점수 <strong>{score}</strong> · 놓침 {misses}
          </p>
          <div className={styles.grid}>
            {Array.from({ length: HOLE_COUNT }, (_, index) => (
              <button
                key={index}
                type="button"
                className={styles.hole}
                onClick={() => handleHoleClick(index)}
                aria-label={activeHole === index ? "두더지 잡기" : "빈 구멍"}
              >
                {activeHole === index && <span className={styles.mole}>🦫</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "finished" && (
        <section className={styles.card}>
          <p className={styles.gradeEmoji} aria-hidden="true">
            {grade.emoji}
          </p>
          <h2>{grade.label}</h2>
          <dl className={styles.summary}>
            <div>
              <dt>잡은 두더지</dt>
              <dd>{score}</dd>
            </div>
            <div>
              <dt>놓친 두더지</dt>
              <dd>{misses}</dd>
            </div>
          </dl>
          <button type="button" className={styles.button} onClick={startGame}>
            다시 하기
          </button>
          <RescueBanner slug="rabbit" />
        </section>
      )}
    </main>
  );
}
