"use client";

import { useEffect, useRef, useState } from "react";
import { BoardItem, PREVIEW_SECONDS, STAGES, STAGE_TIME_LIMIT_SECONDS, buildBoard } from "./gameData";
import { SFX, setBgmMuted, startBgm, unlockAudio } from "./sound";

type Status = "idle" | "preview" | "playing" | "stageClear" | "failed" | "won";
type FailReason = "wrong" | "timeout" | null;
type StackItem = { name: string; emoji: string };

export function useCookingGame() {
  const [status, setStatus] = useState<Status>("idle");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [stack, setStack] = useState<StackItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT_SECONDS);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(PREVIEW_SECONDS);
  const [clearedStage, setClearedStage] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number | null>(null);
  const [musicMuted, setMusicMuted] = useState(false);
  const gameStartRef = useRef<number | null>(null);

  function beginStage(index: number) {
    setStageIndex(index);
    setStack([]);
    setBoard([]);
    setPreviewTimeLeft(PREVIEW_SECONDS);
    setStatus("preview");
  }

  function start() {
    unlockAudio(); // this click is a user gesture — unlock audio for later SFX
    startBgm();
    gameStartRef.current = Date.now();
    setTotalTimeMs(null);
    setFailReason(null);
    beginStage(0);
  }

  function toggleMusic() {
    setMusicMuted((prev) => {
      const next = !prev;
      setBgmMuted(next);
      return next;
    });
  }

  function handleSelect(item: BoardItem) {
    if (status !== "playing") return;
    SFX.click();
    const stage = STAGES[stageIndex];

    if (item.isDecoy) {
      setFailReason("wrong");
      setStatus("failed");
      SFX.fail();
      return;
    }

    // Order doesn't matter — a correct ingredient just has to be picked at
    // some point. Each stage's correct set has no repeats, so once the bowl
    // holds as many items as the recipe needs, it's complete.
    setBoard((prev) => prev.filter((entry) => entry.instanceId !== item.instanceId));
    const nextStack = [...stack, { name: item.name, emoji: item.emoji }];
    setStack(nextStack);

    if (nextStack.length < stage.correctIngredients.length) {
      return;
    }

    if (stageIndex === STAGES.length - 1) {
      const startedAt = gameStartRef.current ?? Date.now();
      setTotalTimeMs(Date.now() - startedAt);
      setStatus("won");
      SFX.success();
      return;
    }

    setClearedStage(stageIndex + 1);
    setStatus("stageClear");
    SFX.success();
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
          SFX.fail();
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
  }, [status, stageIndex]);

  return {
    status,
    failReason,
    stageIndex,
    stageCount: STAGES.length,
    currentStageName: STAGES[stageIndex].name,
    board,
    stack,
    timeLeft,
    previewTimeLeft,
    clearedStage,
    totalTimeMs,
    musicMuted,
    start,
    handleSelect,
    toggleMusic,
  };
}
