"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LEVELS, categoriesForLevel, productsForLevel } from "./data";
import type { CategoryId, Product } from "./types";
import { shuffle } from "./shuffle";
import {
  playFail,
  playFanfare,
  playGameOver,
  playSuccess,
  stopBgm,
} from "./audio";
import {
  getBestTimesSnapshot,
  getServerBestTimes,
  persistBestTimes,
  subscribeBestTimes,
} from "./records";

/** unboxing: 물류 박스 개봉 연출 / playing: 제한시간 진행 / cleared·failed: 라운드 종료 */
export type Phase = "unboxing" | "playing" | "cleared" | "failed";

const UNBOXING_MS = 2200;

interface DragState {
  productId: string;
  x: number;
  y: number;
}

interface Feedback {
  productId: string;
  correct: boolean;
}

interface ClearResult {
  levelId: number;
  seconds: number;
  isRecord: boolean;
}

function emptyPlacedMap(): Record<CategoryId, Product[]> {
  return {
    beverage: [],
    snack: [],
    noodle: [],
    daily: [],
    fresh: [],
    icecream: [],
  };
}

export function useShelfGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];

  const levelProducts = productsForLevel(level);
  const levelCategories = categoriesForLevel(level);

  const [trayIds, setTrayIds] = useState<string[]>(() =>
    shuffle(productsForLevel(LEVELS[0]).map((p) => p.id))
  );
  const [placed, setPlaced] = useState<Record<string, CategoryId>>({});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [phase, setPhase] = useState<Phase>("unboxing");
  const [secondsLeft, setSecondsLeft] = useState(LEVELS[0].seconds);

  // 남은 시간을 ref 로도 들고 있어야 setInterval 콜백에서 setState 업데이터 없이
  // 순수한 부수효과(종료 처리)를 실행할 수 있다.
  const remainingRef = useRef(LEVELS[0].seconds);

  // 최단기록은 localStorage 에 있는 외부 상태라 useSyncExternalStore 로 읽는다.
  // 하이드레이션 중에는 서버 스냅샷(빈 기록)을 쓰고 그 뒤 실제 값으로 바뀐다.
  const bestTimes = useSyncExternalStore(
    subscribeBestTimes,
    getBestTimesSnapshot,
    getServerBestTimes
  );

  const [clearResult, setClearResult] = useState<ClearResult | null>(null);
  const startedAtRef = useRef(0);

  const productById = new Map(levelProducts.map((p) => [p.id, p]));

  const trayProducts: Product[] = trayIds
    .map((id) => productById.get(id))
    .filter((product): product is Product => Boolean(product));

  const placedByCategory = emptyPlacedMap();
  for (const [productId, categoryId] of Object.entries(placed)) {
    const product = productById.get(productId);
    if (product) placedByCategory[categoryId].push(product);
  }

  /** 진열대를 몇 칸으로 나눌지. 레벨 설정을 그대로 쓴다. */
  const slotsPerShelf = level.productsPerCategory;

  // 박스 개봉 연출이 끝나면 플레이 시작
  useEffect(() => {
    if (phase !== "unboxing") return;
    const id = window.setTimeout(() => setPhase("playing"), UNBOXING_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // 제한시간 카운트다운
  useEffect(() => {
    if (phase !== "playing") return;

    // 기록은 카운트다운이 시작되는 이 시점부터 잰다(박스 개봉 연출 시간은 제외).
    startedAtRef.current = performance.now();

    const id = window.setInterval(() => {
      remainingRef.current -= 1;
      setSecondsLeft(remainingRef.current);

      if (remainingRef.current <= 0) {
        window.clearInterval(id);
        setPhase("failed");
        setDragging(null);
        stopBgm();
        playGameOver();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase]);

  function startDrag(productId: string, x: number, y: number) {
    if (phase !== "playing") return;
    setDragging({ productId, x, y });
  }

  function moveDrag(x: number, y: number) {
    setDragging((prev) => (prev ? { ...prev, x, y } : prev));
  }

  function attemptPlace(productId: string, categoryId: CategoryId | null) {
    setDragging(null);
    if (phase !== "playing" || !categoryId) return;

    const product = productById.get(productId);
    if (!product) return;

    const correct = product.categoryId === categoryId;
    setFeedback({ productId, correct });
    window.setTimeout(() => setFeedback(null), 400);

    if (!correct) {
      playFail();
      return;
    }

    setTrayIds((prev) => prev.filter((id) => id !== productId));
    setPlaced((prev) => ({ ...prev, [productId]: categoryId }));

    // 이번 배치로 트레이가 비면 마지막 상품이므로 라운드를 끝낸다.
    if (trayIds.length === 1) {
      const seconds = (performance.now() - startedAtRef.current) / 1000;
      const previousBest = bestTimes[level.id];
      const isRecord = previousBest === undefined || seconds < previousBest;

      setClearResult({ levelId: level.id, seconds, isRecord });
      if (isRecord) {
        // 저장하면 구독자에게 알림이 가서 bestTimes 가 갱신된다
        persistBestTimes({ ...bestTimes, [level.id]: seconds });
      }

      setPhase("cleared");
      playFanfare();
    } else {
      playSuccess();
    }
  }

  /** 지정한 레벨을 처음부터 시작한다. */
  function startLevel(nextIndex: number) {
    const nextLevel = LEVELS[nextIndex];
    remainingRef.current = nextLevel.seconds;
    setSecondsLeft(nextLevel.seconds);
    setLevelIndex(nextIndex);
    setTrayIds(shuffle(productsForLevel(nextLevel).map((p) => p.id)));
    setPlaced({});
    setDragging(null);
    setFeedback(null);
    setClearResult(null);
    setPhase("unboxing");
  }

  /** 현재 레벨 다시하기 */
  function restart() {
    startLevel(levelIndex);
  }

  /** 다음 레벨로. 마지막 레벨이면 1레벨로 돌아간다. */
  function nextLevel() {
    startLevel(levelIndex + 1 < LEVELS.length ? levelIndex + 1 : 0);
  }

  return {
    level,
    levels: LEVELS,
    levelIndex,
    levelCount: LEVELS.length,
    bestTimes,
    clearResult,
    isLastLevel: levelIndex === LEVELS.length - 1,
    categories: levelCategories,
    trayProducts,
    placedByCategory,
    slotsPerShelf,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
    phase,
    secondsLeft,
    isComplete: phase === "cleared",
    restart,
    nextLevel,
  };
}
