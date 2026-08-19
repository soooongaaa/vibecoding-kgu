"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, PRODUCTS } from "./data";
import type { CategoryId, Product } from "./types";
import { shuffle } from "./shuffle";
import {
  playFail,
  playFanfare,
  playGameOver,
  playSuccess,
  stopBgm,
} from "./audio";

/** unboxing: 물류 박스 개봉 연출 / playing: 제한시간 진행 / cleared·failed: 라운드 종료 */
export type Phase = "unboxing" | "playing" | "cleared" | "failed";

export const ROUND_SECONDS = 60;
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

export function useShelfGame() {
  const [trayIds, setTrayIds] = useState<string[]>(() =>
    shuffle(PRODUCTS.map((p) => p.id))
  );
  const [placed, setPlaced] = useState<Record<string, CategoryId>>({});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [phase, setPhase] = useState<Phase>("unboxing");
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);

  // 남은 시간을 ref 로도 들고 있어야 setInterval 콜백에서 setState 업데이터 없이
  // 순수한 부수효과(종료 처리)를 실행할 수 있다.
  const remainingRef = useRef(ROUND_SECONDS);

  const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

  const trayProducts: Product[] = trayIds.map((id) => productById.get(id)!);

  const placedByCategory: Record<CategoryId, Product[]> = {
    beverage: [],
    snack: [],
    noodle: [],
    daily: [],
  };
  for (const [productId, categoryId] of Object.entries(placed)) {
    placedByCategory[categoryId].push(productById.get(productId)!);
  }

  // 박스 개봉 연출이 끝나면 플레이 시작
  useEffect(() => {
    if (phase !== "unboxing") return;
    const id = window.setTimeout(() => setPhase("playing"), UNBOXING_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // 제한시간 카운트다운
  useEffect(() => {
    if (phase !== "playing") return;

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
      setPhase("cleared");
      playFanfare();
    } else {
      playSuccess();
    }
  }

  function restart() {
    remainingRef.current = ROUND_SECONDS;
    setSecondsLeft(ROUND_SECONDS);
    setTrayIds(shuffle(PRODUCTS.map((p) => p.id)));
    setPlaced({});
    setDragging(null);
    setFeedback(null);
    setPhase("unboxing");
  }

  return {
    categories: CATEGORIES,
    trayProducts,
    placedByCategory,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
    phase,
    secondsLeft,
    isComplete: phase === "cleared",
    restart,
  };
}
