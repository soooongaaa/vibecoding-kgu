"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rescue } from "@/lib/rescue";
import styles from "./ReactionGame.module.css";

const TOTAL_ROUNDS = 5;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 4000;

type Phase = "idle" | "waiting" | "ready" | "too-soon" | "result" | "finished";

function getGrade(averageMs: number) {
  if (averageMs < 220) return { label: "번개 반사신경", emoji: "⚡" };
  if (averageMs < 300) return { label: "빠른 편이에요", emoji: "🐆" };
  if (averageMs < 400) return { label: "평균이에요", emoji: "🙂" };
  return { label: "느긋한 편이에요", emoji: "🐢" };
}

export default function ReactionGame() {
  const [phase, setPhase] = useState<Phase>("idle");

  // 게임을 깨면 허브의 동물이 철창에서 풀려난다. 게임 로직은 건드리지 않는다.
  useEffect(() => {
    if (phase === "finished") rescue("horse");
  }, [phase]);
  const [round, setRound] = useState(1);
  const [records, setRecords] = useState<number[]>([]);
  const [lastResultMs, setLastResultMs] = useState<number | null>(null);

  const readyAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startRound = useCallback(() => {
    setPhase("waiting");
    readyAtRef.current = null;
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timerRef.current = setTimeout(() => {
      readyAtRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, []);

  const startGame = useCallback(() => {
    setRecords([]);
    setRound(1);
    setLastResultMs(null);
    startRound();
  }, [startRound]);

  const handleScreenPress = useCallback(() => {
    if (phase === "waiting") {
      clearTimer();
      setPhase("too-soon");
      return;
    }

    if (phase === "ready") {
      const reactionMs = performance.now() - (readyAtRef.current ?? performance.now());
      setLastResultMs(reactionMs);
      setRecords((prev) => [...prev, reactionMs]);
      setPhase("result");
      return;
    }
  }, [phase, clearTimer]);

  const handleNext = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setPhase("finished");
      return;
    }
    setRound((prev) => prev + 1);
    startRound();
  }, [round, startRound]);

  const handleRetryRound = useCallback(() => {
    startRound();
  }, [startRound]);

  const average =
    records.length > 0 ? records.reduce((sum, value) => sum + value, 0) / records.length : 0;
  const best = records.length > 0 ? Math.min(...records) : 0;
  const grade = getGrade(average);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>⚡ 반응속도 테스트</h1>
        {phase !== "idle" && phase !== "finished" && (
          <span className={styles.roundBadge}>
            {round} / {TOTAL_ROUNDS} 라운드
          </span>
        )}
      </header>

      {phase === "idle" && (
        <section className={styles.card}>
          <p>
            화면이 <strong>초록색</strong>으로 바뀌는 순간 최대한 빠르게 탭하세요.
            <br />
            너무 일찍 탭하면 실패! 총 {TOTAL_ROUNDS}라운드 평균 기록으로 등급이 정해져요.
          </p>
          <button type="button" className={styles.button} onClick={startGame}>
            시작하기
          </button>
        </section>
      )}

      {(phase === "waiting" || phase === "ready" || phase === "too-soon") && (
        <button
          type="button"
          className={`${styles.stage} ${
            phase === "ready"
              ? styles.stageReady
              : phase === "too-soon"
                ? styles.stageTooSoon
                : styles.stageWaiting
          }`}
          onPointerDown={phase === "too-soon" ? undefined : handleScreenPress}
          aria-label={
            phase === "ready" ? "지금 탭하세요" : phase === "too-soon" ? "너무 빨랐어요" : "기다리는 중"
          }
        >
          {phase === "waiting" && <span>기다리세요...</span>}
          {phase === "ready" && <span>지금 탭!</span>}
          {phase === "too-soon" && (
            <div className={styles.tooSoonBox}>
              <span>성급했어요! 초록색이 될 때까지 기다려주세요.</span>
              <button
                type="button"
                className={styles.buttonLight}
                onClick={handleRetryRound}
              >
                이 라운드 다시하기
              </button>
            </div>
          )}
        </button>
      )}

      {phase === "result" && lastResultMs !== null && (
        <section className={styles.card}>
          <p className={styles.resultTime}>{Math.round(lastResultMs)}ms</p>
          <p>
            {round}라운드 기록이에요.{" "}
            {round >= TOTAL_ROUNDS ? "마지막 라운드였어요!" : "다음 라운드로 이어가볼까요?"}
          </p>
          <button type="button" className={styles.button} onClick={handleNext}>
            {round >= TOTAL_ROUNDS ? "결과 보기" : "다음 라운드"}
          </button>
        </section>
      )}

      {phase === "finished" && (
        <section className={styles.card}>
          <p className={styles.gradeEmoji} aria-hidden="true">
            {grade.emoji}
          </p>
          <h2>{grade.label}</h2>
          <dl className={styles.summary}>
            <div>
              <dt>평균 기록</dt>
              <dd>{Math.round(average)}ms</dd>
            </div>
            <div>
              <dt>최고 기록</dt>
              <dd>{Math.round(best)}ms</dd>
            </div>
          </dl>
          <ol className={styles.roundList}>
            {records.map((value, index) => (
              <li key={index}>
                {index + 1}라운드: {Math.round(value)}ms
              </li>
            ))}
          </ol>
          <button type="button" className={styles.button} onClick={startGame}>
            다시 하기
          </button>
        </section>
      )}
    </main>
  );
}
