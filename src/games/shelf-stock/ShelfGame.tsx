"use client";

import { CATEGORIES } from "./data";
import { ProductIcon } from "./ProductIcon";
import { useShelfGame } from "./useShelfGame";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  const { trayProducts, dragging, startDrag, moveDrag, endDrag } =
    useShelfGame();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>편의점 상품 진열</h1>

      <section className={styles.categories}>
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            className={styles.categoryBox}
          >
            <h2 className={styles.categoryLabel}>{category.label}</h2>
          </div>
        ))}
      </section>

      <section className={styles.tray}>
        {trayProducts.map((product) => {
          const isDragging = dragging?.productId === product.id;
          return (
            <div
              key={product.id}
              className={`${styles.productChip} ${isDragging ? styles.dragging : ""}`}
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
              onPointerUp={() => {
                endDrag();
              }}
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
