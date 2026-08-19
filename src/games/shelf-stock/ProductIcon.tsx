import type { CategoryId, Product } from "./types";

const CATEGORY_COLOR: Record<CategoryId, string> = {
  beverage: "#4098d7",
  snack: "#e0a03c",
  noodle: "#d9534f",
  daily: "#5cb85c",
};

function CategoryGlyph({ categoryId }: { categoryId: CategoryId }) {
  const color = CATEGORY_COLOR[categoryId];
  switch (categoryId) {
    case "beverage":
      return <circle cx="20" cy="20" r="14" fill={color} />;
    case "snack":
      return <polygon points="20,6 34,34 6,34" fill={color} />;
    case "noodle":
      return <rect x="6" y="6" width="28" height="28" rx="6" fill={color} />;
    case "daily":
      return (
        <polygon
          points="20,4 24,16 37,16 26,24 30,36 20,28 10,36 14,24 3,16 16,16"
          fill={color}
        />
      );
  }
}

export function ProductIcon({ product }: { product: Product }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <CategoryGlyph categoryId={product.categoryId} />
    </svg>
  );
}
