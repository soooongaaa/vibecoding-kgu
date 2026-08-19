"use client";

import { useState } from "react";
import { PRODUCTS } from "./data";

interface DragState {
  productId: string;
  x: number;
  y: number;
}

export function useShelfGame() {
  const [trayIds] = useState<string[]>(() => PRODUCTS.map((p) => p.id));
  const [dragging, setDragging] = useState<DragState | null>(null);

  const trayProducts = trayIds.map(
    (id) => PRODUCTS.find((p) => p.id === id)!
  );

  function startDrag(productId: string, x: number, y: number) {
    setDragging({ productId, x, y });
  }

  function moveDrag(x: number, y: number) {
    setDragging((prev) => (prev ? { ...prev, x, y } : prev));
  }

  function endDrag() {
    setDragging(null);
  }

  return { trayProducts, dragging, startDrag, moveDrag, endDrag };
}
