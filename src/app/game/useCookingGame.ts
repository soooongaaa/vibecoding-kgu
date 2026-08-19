"use client";

import { useEffect, useRef, useState } from "react";
import { BoardItem, PREVIEW_SECONDS, STAGES, STAGE_TIME_LIMIT_SECONDS, buildBoard } from "./gameData";

type Status = "idle" | "preview" | "playing" | "stageClear" | "failed" | "won";
type FailReason = "wrong" | "timeout" | null;
type StackItem = { name: string; emoji: string };

export function useCookingGame() {
  const [status, setStatus] = useState<Status>("idle");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [stack, setStack] = useState<StackItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT_SECONDS);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(PREVIEW_SECONDS);
  const [clearedStage, setClearedStage] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number | null>(null);
  const gameStartRef = useRef<number | null>(null);

  function beginStage(index: number) {
    setStageIndex(index);
    setStack([]);
    setProgress(0);
    setBoard([]);
    setPreviewTimeLeft(PREVIEW_SECONDS);
    setStatus("preview");
  }

  function start() {
    gameStartRef.current = Date.now();
    setTotalTimeMs(null);
    setFailReason(null);
    beginStage(0);
  }

  function handleSelect(item: BoardItem) {
    if (status !== "playing") return;
    const stage = STAGES[stageIndex];
    const expectedName = stage.correctSequence[progress];

    if (item.isDecoy || item.name !== expectedName) {
      setFailReason("wrong");
      setStatus("failed");
      return;
    }

    setBoard((prev) => prev.filter((entry) => entry.instanceId !== item.instanceId));
    setStack((prev) => [...prev, { name: item.name, emoji: item.emoji }]);
    const nextProgress = progress + 1;

    if (nextProgress < stage.correctSequence.length) {
      setProgress(nextProgress);
      return;
    }

    // stage cleared
    if (stageIndex === STAGES.length - 1) {
      const startedAt = gameStartRef.current ?? Date.now();
      setTotalTimeMs(Date.now() - startedAt);
      setStatus("won");
      return;
    }

    setClearedStage(stageIndex + 1);
    setStatus("stageClear");
  }

  // recipe preview countdown -> reveal the shuffled board and start the stage timer
  useEffect(() => {
    if (status !== "preview") return;
    const interval = setInterval(() => {
      setPreviewTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setBoard(buildBoard(STAGES[stageIndex]));
          setTimeLeft(STAGE_TIME_LIMIT_SECONDS);
          setStatus("playing");
          return PREVIEW_SECONDS;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, stageIndex]);

  // stage countdown timer, active only while playing
  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setFailReason("timeout");
          setStatus("failed");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // brief "stage cleared" pause, then move into the next stage's preview
  useEffect(() => {
    if (status !== "stageClear") return;
    const timeout = setTimeout(() => beginStage(stageIndex + 1), 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stageIndex]);

  return {
    status,
    failReason,
    stageIndex,
    stageCount: STAGES.length,
    currentStageName: STAGES[stageIndex].name,
    board,
    stack,
    progress,
    timeLeft,
    previewTimeLeft,
    clearedStage,
    totalTimeMs,
    start,
    handleSelect,
  };
}
