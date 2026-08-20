"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./CheeseCircuit.module.css";
import {
  createBoard,
  isCleared,
  parTurns,
  poweredSet,
  wireCount,
  DIRECTIONS,
  NORTH,
  EAST,
  SOUTH,
  WEST,
  type Board,
} from "./board";

const STAGES = [
  { cols: 4, rows: 4, name: "부엌 바닥" },
  { cols: 5, rows: 5, name: "벽 속 배선" },
  { cols: 6, rows: 6, name: "치즈 냉장고" },
];

const BASE_SCORE = 300;
/** 최소 회전 1회당 이만큼 초를 여유로 준다. 이 시간을 넘겨야 감점이 시작된다. */
const SECONDS_PER_TURN = 3;
const PENALTY_PER_EXTRA_TURN = 5;
const PENALTY_PER_OVERTIME_SECOND = 2;
const MIN_STAGE_SCORE = 50;

/** 눈동자가 눈 안에서 움직일 수 있는 최대 거리(px) */
const PUPIL_REACH_X = 2.8;
const PUPIL_REACH_Y = 2.4;
/** 이 거리 안에서는 커서를 끝까지 쫓아본다 */
const GAZE_RANGE = 260;

type Phase = "ready" | "playing" | "stageClear" | "won";

const SEGMENT_ENDS: Record<number, { x: number; y: number }> = {
  [NORTH]: { x: 50, y: 0 },
  [EAST]: { x: 100, y: 50 },
  [SOUTH]: { x: 50, y: 100 },
  [WEST]: { x: 0, y: 50 },
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function CheeseCircuit() {
  const [stageIndex, setStageIndex] = useState(0);
  const [board, setBoard] = useState<Board | null>(null);
  const [turns, setTurns] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stageScore, setStageScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const loadStage = useCallback((index: number) => {
    const stage = STAGES[index];
    const next = createBoard(stage.cols, stage.rows);
    setStageIndex(index);
    setBoard(next);
    setTurns(new Array(next.cells.length).fill(0));
    setMoves(0);
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // 쥐가 커서를 눈으로 쫓는다. 상태로 두면 커서를 움직일 때마다 판 전체가
  // 다시 그려지므로, CSS 변수만 직접 갱신한다.
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const face = faceRef.current;
    if (!face) return;

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = face.getBoundingClientRect();
      const dx = pointerX - (rect.left + rect.width / 2);
      const dy = pointerY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < 1) return;

      const reach = Math.min(1, distance / GAZE_RANGE);
      face.style.setProperty("--pupil-x", `${(dx / distance) * PUPIL_REACH_X * reach}px`);
      face.style.setProperty("--pupil-y", `${(dy / distance) * PUPIL_REACH_Y * reach}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  const powered = useMemo(
    () => (board ? poweredSet(board, turns) : new Set<number>()),
    [board, turns],
  );

  const startRun = useCallback(() => {
    setTotalScore(0);
    setTotalTime(0);
    setStageScore(0);
    loadStage(0);
    setPhase("playing");
  }, [loadStage]);

  const goToNextStage = useCallback(() => {
    loadStage(stageIndex + 1);
    setPhase("playing");
  }, [loadStage, stageIndex]);

  // 클리어 판정은 회전 직후에 바로 한다. 렌더 뒤 effect로 미루면
  // 상태가 한 번 더 튀어서 React가 경고한다.
  const rotateTile = useCallback(
    (index: number) => {
      if (phase !== "playing" || !board) return;
      if (board.cells[index].solved === 0) return;

      const nextTurns = [...turns];
      nextTurns[index] += 1;
      const nextMoves = moves + 1;

      setTurns(nextTurns);
      setMoves(nextMoves);

      if (!isCleared(board, nextTurns)) return;

      const par = parTurns(board);
      const extraTurns = Math.max(0, nextMoves - par);
      const overtime = Math.max(0, elapsed - par * SECONDS_PER_TURN);
      const gained = Math.max(
        MIN_STAGE_SCORE,
        BASE_SCORE -
          extraTurns * PENALTY_PER_EXTRA_TURN -
          overtime * PENALTY_PER_OVERTIME_SECOND,
      );

      setStageScore(gained);
      setTotalScore((prev) => prev + gained);
      setTotalTime((prev) => prev + elapsed);
      setPhase(stageIndex === STAGES.length - 1 ? "won" : "stageClear");
    },
    [board, phase, turns, moves, elapsed, stageIndex],
  );

  const stage = STAGES[stageIndex];
  const totalWires = board ? wireCount(board) : 0;
  const litWires = board
    ? board.cells.filter((cell, i) => cell.solved !== 0 && powered.has(i)).length
    : 0;
  const progress = totalWires === 0 ? 0 : Math.round((litWires / totalWires) * 100);

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>생쥐의 우리</p>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>치즈 미로</h1>

          <div className={styles.mouseHole} aria-hidden="true">
            <div className={styles.mouse} ref={faceRef}>
              <span className={`${styles.ear} ${styles.earLeft}`} />
              <span className={`${styles.ear} ${styles.earRight}`} />
              <span className={styles.face}>
                <span className={`${styles.eye} ${styles.eyeLeft}`}>
                  <span className={styles.pupil} />
                </span>
                <span className={`${styles.eye} ${styles.eyeRight}`}>
                  <span className={styles.pupil} />
                </span>
                <span className={`${styles.whisker} ${styles.whiskerLeft}`} />
                <span className={`${styles.whisker} ${styles.whiskerRight}`} />
                <span className={styles.nose} />
              </span>
            </div>
          </div>
        </div>
        <p className={styles.lead}>
          생쥐가 갉아먹어 전선이 끊겼어요. 전선을 돌려서 배터리의 전기가 끊긴 곳 없이
          모든 전선에 흐르게 해 주세요.
        </p>
      </header>

      <div className={styles.hud}>
        <span>
          <small>스테이지</small>
          <strong>
            {stageIndex + 1} / {STAGES.length}
          </strong>
        </span>
        <span>
          <small>회전</small>
          <strong>{moves}</strong>
        </span>
        <span>
          <small>시간</small>
          <strong>{formatTime(elapsed)}</strong>
        </span>
        <span>
          <small>점수</small>
          <strong>{totalScore}</strong>
        </span>
      </div>

      <div className={styles.boardBox}>
        {/* 판은 시작 버튼을 누른 뒤에 만든다. 서버 렌더와 어긋날 일이 없다. */}
        {!board && (
          <div
            className={styles.board}
            style={{ "--cols": STAGES[0].cols } as React.CSSProperties}
            aria-hidden="true"
          />
        )}

        {board && (
          <div
            className={styles.board}
            style={{ "--cols": board.cols } as React.CSSProperties}
            aria-label={`${stage.name} 회로판, 가로 ${board.cols}칸 세로 ${board.rows}칸`}
          >
            {board.cells.map((cell, index) => {
              const isWire = cell.solved !== 0;
              const isLive = isWire && powered.has(index);
              const row = Math.floor(index / board.cols) + 1;
              const col = (index % board.cols) + 1;
              const endpoint =
                index === board.source ? "🔋" : index === board.target ? "🧀" : null;

              if (!isWire) {
                return <span key={index} className={styles.blank} aria-hidden="true" />;
              }

              return (
                <button
                  key={index}
                  type="button"
                  className={`${styles.tile} ${isLive ? styles.live : ""}`}
                  onClick={() => rotateTile(index)}
                  aria-label={`${row}행 ${col}열 전선 ${isLive ? "연결됨" : "끊김"}, 눌러서 회전`}
                >
                  <svg
                    className={styles.wire}
                    viewBox="0 0 100 100"
                    style={{ transform: `rotate(${turns[index] * 90}deg)` }}
                    aria-hidden="true"
                  >
                    {DIRECTIONS.filter((dir) => (cell.baseMask & dir) !== 0).map((dir) => (
                      <line
                        key={dir}
                        x1={50}
                        y1={50}
                        x2={SEGMENT_ENDS[dir].x}
                        y2={SEGMENT_ENDS[dir].y}
                      />
                    ))}
                    <circle cx={50} cy={50} r={12} />
                  </svg>
                  {endpoint && (
                    <span className={styles.endpoint} aria-hidden="true">
                      {endpoint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {phase === "ready" && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>전선을 이어 주세요</p>
            <p>
              전선 타일을 누르면 90°씩 돌아갑니다.
              <br />
              배터리 🔋 에서 치즈 🧀 까지, 끊긴 전선 하나 없이
              <br />
              <strong>모든 전선에 불이 들어오면</strong> 클리어!
            </p>
            <button className={styles.button} onClick={startRun}>
              시작하기
            </button>
          </div>
        )}

        {phase === "stageClear" && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>{stage.name} 통과!</p>
            <p>
              회전 {moves}회 · {formatTime(elapsed)} · {stageScore}점
            </p>
            <button className={styles.button} onClick={goToNextStage}>
              다음 스테이지
            </button>
          </div>
        )}

        {phase === "won" && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>🧀 치즈 냉장고에 불이 들어왔어요!</p>
            <p>
              최종 점수 <strong>{totalScore}</strong>점 · 총 {formatTime(totalTime)}
            </p>
            <button className={styles.button} onClick={startRun}>
              다시 하기
            </button>
          </div>
        )}
      </div>

      <div
        className={styles.progress}
        role="progressbar"
        aria-valuenow={litWires}
        aria-valuemin={0}
        aria-valuemax={totalWires}
        aria-label="불이 들어온 전선"
      >
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>
          불이 들어온 전선 {litWires} / {totalWires}
        </span>
      </div>
    </div>
  );
}
