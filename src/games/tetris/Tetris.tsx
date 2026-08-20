"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rescue } from "@/lib/rescue";
import RescueBanner from "@/components/game/RescueBanner";
import styles from "./Tetris.module.css";
import {
  sfxClear,
  sfxDrop,
  sfxGameOver,
  sfxLineClear,
  sfxMove,
  sfxRotate,
  startMusic,
  stopMusic,
} from "./sound";

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const BASE_INTERVAL_MS = 1100;
const MIN_INTERVAL_MS = 350;
const LEVEL_SPEEDUP_MS = 40;
const LINES_PER_LEVEL = 15;
const CLEAR_LINES = 5;
const LINE_FLASH_MS = 180;
const BOARD_FILL = "#1e293b";
const GRID_LINE = "rgba(148, 163, 184, 0.08)";

type Matrix = number[][];

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

const SHAPES: Record<PieceType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const COLORS: Record<PieceType, string> = {
  I: "#38bdf8",
  O: "#facc15",
  T: "#c084fc",
  S: "#4ade80",
  Z: "#f87171",
  J: "#60a5fa",
  L: "#fb923c",
};

const PIECE_TYPES = Object.keys(SHAPES) as PieceType[];

function rotateMatrix(matrix: Matrix): Matrix {
  const n = matrix.length;
  const result: Matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      result[x][n - 1 - y] = matrix[y][x];
    }
  }
  return result;
}

function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

type ActivePiece = {
  type: PieceType;
  matrix: Matrix;
  x: number;
  y: number;
};

function spawnPiece(type: PieceType): ActivePiece {
  const matrix = SHAPES[type];
  return {
    type,
    matrix,
    x: Math.floor((COLS - matrix.length) / 2),
    y: -1,
  };
}

function createEmptyBoard(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function canPlace(
  board: (PieceType | null)[][],
  matrix: Matrix,
  x: number,
  y: number,
): boolean {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (!matrix[row][col]) continue;
      const boardX = x + col;
      const boardY = y + row;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
      if (boardY >= 0 && board[boardY][boardX]) return false;
    }
  }
  return true;
}

function ghostY(
  board: (PieceType | null)[][],
  matrix: Matrix,
  x: number,
  y: number,
): number {
  let gy = y;
  while (canPlace(board, matrix, x, gy + 1)) gy++;
  return gy;
}

type Phase = "ready" | "playing" | "cleared" | "over";

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");

  // 게임을 깨면 허브의 동물이 철창에서 풀려난다. 게임 로직은 건드리지 않는다.
  useEffect(() => {
    if (phase === "cleared") rescue("snake");
  }, [phase]);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [nextType, setNextType] = useState<PieceType>(() => randomPieceType());
  const [muted, setMuted] = useState(false);

  const phaseRef = useRef<Phase>("ready");
  const boardRef = useRef(createEmptyBoard());
  const pieceRef = useRef<ActivePiece>(spawnPiece(randomPieceType()));
  const nextTypeRef = useRef<PieceType>(nextType);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropAccRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const clearedRef = useRef(false);
  const mutedRef = useRef(false);
  const flashRef = useRef<{ rows: number[]; until: number } | null>(null);

  const resetGame = useCallback(() => {
    boardRef.current = createEmptyBoard();
    pieceRef.current = spawnPiece(randomPieceType());
    nextTypeRef.current = randomPieceType();
    setNextType(nextTypeRef.current);
    linesRef.current = 0;
    levelRef.current = 1;
    dropAccRef.current = 0;
    clearedRef.current = false;
    flashRef.current = null;
    setLines(0);
    setLevel(1);
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

  const lockPiece = useCallback((time: number) => {
    const piece = pieceRef.current;
    const board = boardRef.current;
    for (let row = 0; row < piece.matrix.length; row++) {
      for (let col = 0; col < piece.matrix[row].length; col++) {
        if (!piece.matrix[row][col]) continue;
        const boardY = piece.y + row;
        const boardX = piece.x + col;
        if (boardY >= 0) board[boardY][boardX] = piece.type;
      }
    }

    const clearedRows: number[] = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row].every((cell) => cell !== null)) {
        clearedRows.push(row);
      }
    }

    if (clearedRows.length > 0) {
      flashRef.current = {
        rows: clearedRows,
        until: time + LINE_FLASH_MS,
      };
      for (const row of clearedRows) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));
      }

      linesRef.current += clearedRows.length;
      levelRef.current = Math.floor(linesRef.current / LINES_PER_LEVEL) + 1;
      setLines(linesRef.current);
      setLevel(levelRef.current);
      if (!mutedRef.current) sfxLineClear(clearedRows.length);

      if (!clearedRef.current && linesRef.current >= CLEAR_LINES) {
        clearedRef.current = true;
        phaseRef.current = "cleared";
        setPhase("cleared");
        stopMusic();
        if (!mutedRef.current) sfxClear();
        return;
      }
    } else if (!mutedRef.current) {
      sfxDrop();
    }

    const next = spawnPiece(nextTypeRef.current);
    nextTypeRef.current = randomPieceType();
    setNextType(nextTypeRef.current);

    if (!canPlace(board, next.matrix, next.x, Math.max(next.y, 0))) {
      phaseRef.current = "over";
      setPhase("over");
      stopMusic();
      if (!mutedRef.current) sfxGameOver();
      return;
    }
    pieceRef.current = next;
  }, []);

  const tryMove = useCallback((dx: number, dy: number) => {
    if (phaseRef.current !== "playing") return false;
    const piece = pieceRef.current;
    const nx = piece.x + dx;
    const ny = piece.y + dy;
    if (canPlace(boardRef.current, piece.matrix, nx, ny)) {
      pieceRef.current = { ...piece, x: nx, y: ny };
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const piece = pieceRef.current;
    const rotated = rotateMatrix(piece.matrix);
    if (canPlace(boardRef.current, rotated, piece.x, piece.y)) {
      pieceRef.current = { ...piece, matrix: rotated };
      if (!mutedRef.current) sfxRotate();
    }
  }, []);

  const moveLeft = useCallback(() => {
    if (tryMove(-1, 0) && !mutedRef.current) sfxMove();
  }, [tryMove]);

  const moveRight = useCallback(() => {
    if (tryMove(1, 0) && !mutedRef.current) sfxMove();
  }, [tryMove]);

  const hardDrop = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    while (tryMove(0, 1)) {
      /* keep dropping */
    }
    lockPiece(performance.now());
  }, [tryMove, lockPiece]);

  const softDrop = useCallback(() => {
    if (!tryMove(0, 1)) {
      lockPiece(performance.now());
    }
  }, [tryMove, lockPiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing") return;
      if (e.key === "ArrowLeft") moveLeft();
      else if (e.key === "ArrowRight") moveRight();
      else if (e.key === "ArrowDown") softDrop();
      else if (e.key === "ArrowUp") tryRotate();
      else if (e.key === " ") {
        e.preventDefault();
        hardDrop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLeft, moveRight, tryRotate, softDrop, hardDrop]);

  useEffect(() => {
    return () => stopMusic();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const drawCell = (col: number, row: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2);
      ctx.globalAlpha = 1;
    };

    const draw = (time: number) => {
      ctx.fillStyle = BOARD_FILL;
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      ctx.strokeStyle = GRID_LINE;
      ctx.lineWidth = 1;
      for (let col = 1; col < COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * CELL, 0);
        ctx.lineTo(col * CELL, ROWS * CELL);
        ctx.stroke();
      }
      for (let row = 1; row < ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * CELL);
        ctx.lineTo(COLS * CELL, row * CELL);
        ctx.stroke();
      }

      const board = boardRef.current;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cell = board[row][col];
          if (!cell) continue;
          drawCell(col, row, COLORS[cell]);
        }
      }

      const flash = flashRef.current;
      if (flash && time < flash.until) {
        for (const row of flash.rows) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, row * CELL, COLS * CELL, CELL);
          ctx.globalAlpha = 1;
        }
      } else if (flash) {
        flashRef.current = null;
      }

      if (phaseRef.current === "playing") {
        const piece = pieceRef.current;
        const gy = ghostY(board, piece.matrix, piece.x, piece.y);
        for (let row = 0; row < piece.matrix.length; row++) {
          for (let col = 0; col < piece.matrix[row].length; col++) {
            if (!piece.matrix[row][col]) continue;
            const y = gy + row;
            if (y < 0) continue;
            drawCell(piece.x + col, y, COLORS[piece.type], 0.2);
          }
        }

        for (let row = 0; row < piece.matrix.length; row++) {
          for (let col = 0; col < piece.matrix[row].length; col++) {
            if (!piece.matrix[row][col]) continue;
            const y = piece.y + row;
            if (y < 0) continue;
            drawCell(piece.x + col, y, COLORS[piece.type]);
          }
        }
      }
    };

    const step = (time: number) => {
      if (phaseRef.current !== "playing") {
        lastTimeRef.current = null;
        draw(time);
        animationId = requestAnimationFrame(step);
        return;
      }

      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      dropAccRef.current += delta;

      const interval = Math.max(
        MIN_INTERVAL_MS,
        BASE_INTERVAL_MS - (levelRef.current - 1) * LEVEL_SPEEDUP_MS,
      );

      if (dropAccRef.current >= interval) {
        dropAccRef.current = 0;
        if (!tryMove(0, 1)) {
          lockPiece(time);
        }
      }

      draw(time);
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [tryMove, lockPiece]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>테트리스</h1>
        <button
          className={styles.muteButton}
          onClick={toggleMute}
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className={styles.hud}>
        <span>레벨: {level}</span>
        <span>줄: {lines}</span>
      </div>

      <div className={styles.playArea}>
        <div className={styles.canvasBox}>
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className={styles.canvas}
          />

          {phase === "ready" && (
            <div className={styles.overlay}>
              <p>방향키로 이동/회전, 스페이스바로 하드 드롭</p>
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
              <RescueBanner slug="snake" />
            </div>
          )}

          {phase === "over" && (
            <div className={styles.overlay}>
              <p className={styles.result}>게임 오버</p>
              <button className={styles.button} onClick={startGame}>
                다시 하기
              </button>
            </div>
          )}
        </div>

        {phase === "playing" && (
          <div className={styles.nextBox}>
            <span className={styles.nextLabel}>다음</span>
            <div className={styles.nextGrid}>
              {SHAPES[nextType].map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={styles.nextCell}
                    style={{
                      background: cell ? COLORS[nextType] : "transparent",
                    }}
                  />
                )),
              )}
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && (
        <div className={styles.touchControls}>
          <button onClick={moveLeft} aria-label="왼쪽으로 이동">
            ←
          </button>
          <button onClick={tryRotate} aria-label="회전">
            ⟳
          </button>
          <button onClick={moveRight} aria-label="오른쪽으로 이동">
            →
          </button>
          <button onClick={softDrop} aria-label="소프트 드롭">
            ↓
          </button>
          <button onClick={hardDrop} aria-label="하드 드롭">
            ⤓
          </button>
        </div>
      )}
    </div>
  );
}
