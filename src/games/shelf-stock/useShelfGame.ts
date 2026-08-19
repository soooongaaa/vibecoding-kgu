"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS } from "./data";
import type { CategoryId, Product } from "./types";
import { shuffle } from "./shuffle";

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

  function startDrag(productId: string, x: number, y: number) {
    setDragging({ productId, x, y });
  }

  function moveDrag(x: number, y: number) {
    setDragging((prev) => (prev ? { ...prev, x, y } : prev));
  }

  function attemptPlace(productId: string, categoryId: CategoryId | null) {
    setDragging(null);
    if (!categoryId) return;

    const product = productById.get(productId);
    if (!product) return;

    const correct = product.categoryId === categoryId;
    setFeedback({ productId, correct });
    window.setTimeout(() => setFeedback(null), 400);

    if (correct) {
      setTrayIds((prev) => prev.filter((id) => id !== productId));
      setPlaced((prev) => ({ ...prev, [productId]: categoryId }));
    }
  }

  const isComplete = trayProducts.length === 0;

  function restart() {
    setTrayIds(shuffle(PRODUCTS.map((p) => p.id)));
    setPlaced({});
    setDragging(null);
    setFeedback(null);
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
    isComplete,
    restart,
  };
}
