"use client";

import { CATEGORIES, PRODUCTS } from "./data";
import { ProductIcon } from "./ProductIcon";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>편의점 상품 진열</h1>

      <section className={styles.categories}>
        {CATEGORIES.map((category) => (
          <div key={category.id} className={styles.categoryBox}>
            <h2 className={styles.categoryLabel}>{category.label}</h2>
          </div>
        ))}
      </section>

      <section className={styles.tray}>
        {PRODUCTS.map((product) => (
          <div key={product.id} className={styles.productChip}>
            <ProductIcon product={product} />
            <span className={styles.productName}>{product.name}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
