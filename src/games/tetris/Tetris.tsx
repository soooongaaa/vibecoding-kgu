"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Tetris.module.css";

const COLS = 10;
const ROWS = 20;
const CELL = 24;
const BASE_INTERVAL_MS = 800;
const MIN_INTERVAL_MS = 150;
const LEVEL_SPEEDUP_MS = 70;
const LINES_PER_LEVEL = 10;
const LINE_SCORES = [0, 100, 300, 500, 800];

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

type Phase = "ready" | "playing" | "over";

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);

  const phaseRef = useRef<Phase>("ready");
  const boardRef = useRef(createEmptyBoard());
  const pieceRef = useRef<ActivePiece>(spawnPiece(randomPieceType()));
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropAccRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const resetGame = useCallback(() => {
    boardRef.current = createEmptyBoard();
    pieceRef.current = spawnPiece(randomPieceType());
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropAccRef.current = 0;
    setScore(0);
    setLines(0);
    setLevel(1);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
  }, [resetGame]);

  const lockPiece = useCallback(() => {
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

    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row].every((cell) => cell !== null)) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        row++;
      }
    }

    if (cleared > 0) {
      scoreRef.current += LINE_SCORES[cleared] * levelRef.current;
      linesRef.current += cleared;
      levelRef.current = Math.floor(linesRef.current / LINES_PER_LEVEL) + 1;
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);
    }

    const next = spawnPiece(randomPieceType());
    if (!canPlace(board, next.matrix, next.x, Math.max(next.y, 0))) {
      phaseRef.current = "over";
      setPhase("over");
      return;
    }
    pieceRef.current = next;
  }, []);

  const tryMove = useCallback(
    (dx: number, dy: number) => {
      if (phaseRef.current !== "playing") return false;
      const piece = pieceRef.current;
      const nx = piece.x + dx;
      const ny = piece.y + dy;
      if (canPlace(boardRef.current, piece.matrix, nx, ny)) {
        pieceRef.current = { ...piece, x: nx, y: ny };
        return true;
      }
      return false;
    },
    [],
  );

  const tryRotate = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const piece = pieceRef.current;
    const rotated = rotateMatrix(piece.matrix);
    if (canPlace(boardRef.current, rotated, piece.x, piece.y)) {
      pieceRef.current = { ...piece, matrix: rotated };
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    while (tryMove(0, 1)) {
      /* keep dropping */
    }
    lockPiece();
  }, [tryMove, lockPiece]);

  const softDrop = useCallback(() => {
    if (!tryMove(0, 1)) {
      lockPiece();
    }
  }, [tryMove, lockPiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing") return;
      if (e.key === "ArrowLeft") tryMove(-1, 0);
      else if (e.key === "ArrowRight") tryMove(1, 0);
      else if (e.key === "ArrowDown") softDrop();
      else if (e.key === "ArrowUp") tryRotate();
      else if (e.key === " ") {
        e.preventDefault();
        hardDrop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tryMove, tryRotate, softDrop, hardDrop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      const board = boardRef.current;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const cell = board[row][col];
          if (!cell) continue;
          ctx.fillStyle = COLORS[cell];
          ctx.fillRect(col * CELL, row * CELL, CELL - 1, CELL - 1);
        }
      }

      const piece = pieceRef.current;
      ctx.fillStyle = COLORS[piece.type];
      for (let row = 0; row < piece.matrix.length; row++) {
        for (let col = 0; col < piece.matrix[row].length; col++) {
          if (!piece.matrix[row][col]) continue;
          const y = piece.y + row;
          if (y < 0) continue;
          ctx.fillRect(
            (piece.x + col) * CELL,
            y * CELL,
            CELL - 1,
            CELL - 1,
          );
        }
      }
    };

    const step = (time: number) => {
      if (phaseRef.current !== "playing") {
        lastTimeRef.current = null;
        draw();
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
          lockPiece();
        }
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [tryMove, lockPiece]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>테트리스</h1>

      <div className={styles.hud}>
        <span>점수: {score}</span>
        <span>레벨: {level}</span>
        <span>줄: {lines}</span>
      </div>

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

        {phase === "over" && (
          <div className={styles.overlay}>
            <p className={styles.result}>게임 오버. 점수 {score}</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}
      </div>

      {phase === "playing" && (
        <div className={styles.touchControls}>
          <button onClick={() => tryMove(-1, 0)} aria-label="왼쪽으로 이동">
            ←
          </button>
          <button onClick={tryRotate} aria-label="회전">
            ⟳
          </button>
          <button onClick={() => tryMove(1, 0)} aria-label="오른쪽으로 이동">
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
