"use client";

import { ProductIcon } from "./ProductIcon";
import { useShelfGame } from "./useShelfGame";
import type { CategoryId } from "./types";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  const {
    categories,
    trayProducts,
    placedByCategory,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
    isComplete,
    restart,
  } = useShelfGame();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>편의점 상품 진열</h1>
      {isComplete && (
        <p className={styles.completeBanner}>완료!</p>
      )}

      <button
        type="button"
        className={styles.restartButton}
        onClick={restart}
      >
        다시하기
      </button>

      <section className={styles.categories}>
        {categories.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            className={styles.categoryBox}
          >
            <h2 className={styles.categoryLabel}>{category.label}</h2>
            <div className={styles.placedRow}>
              {placedByCategory[category.id].map((product) => (
                <ProductIcon key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.tray}>
        {trayProducts.map((product) => {
          const isDragging = dragging?.productId === product.id;
          return (
            <div
              key={product.id}
              className={`${styles.productChip} ${
                isDragging ? styles.dragging : ""
              } ${
                feedback?.productId === product.id
                  ? feedback.correct
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong
                  : ""
              }`}
              style={
                isDragging
                  ? { left: dragging.x, top: dragging.y }
                  : undefined
              }
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startDrag(product.id, e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (dragging?.productId === product.id) {
                  moveDrag(e.clientX, e.clientY);
                }
              }}
              onPointerUp={(e) => {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                const categoryEl = el?.closest<HTMLElement>(
                  "[data-category-id]"
                );
                const categoryId = categoryEl?.dataset
                  .categoryId as CategoryId | undefined;
                attemptPlace(product.id, categoryId ?? null);
              }}
              onPointerCancel={() => attemptPlace(product.id, null)}
            >
              <ProductIcon product={product} />
              <span className={styles.productName}>{product.name}</span>
            </div>
          );
        })}
      </section>
    </main>
  );
}
