import type { Product } from "./types";

type Shape = "circle" | "triangle" | "rect" | "star";

interface ProductVisual {
  shape: Shape;
  color: string;
}

const PRODUCT_VISUAL: Record<string, ProductVisual> = {
  cola: { shape: "circle", color: "#4098d7" },
  juice: { shape: "triangle", color: "#e0a03c" },
  water: { shape: "rect", color: "#17a2b8" },
  chips: { shape: "star", color: "#d9534f" },
  chocolate: { shape: "circle", color: "#8a6d3b" },
  cookie: { shape: "triangle", color: "#f0ad4e" },
  ramen: { shape: "rect", color: "#c9302c" },
  udon: { shape: "star", color: "#5bc0de" },
  jjajang: { shape: "circle", color: "#6f42c1" },
  tissue: { shape: "triangle", color: "#20c997" },
  toothbrush: { shape: "rect", color: "#e83e8c" },
  battery: { shape: "star", color: "#6c757d" },
};

function ProductGlyph({ shape, color }: ProductVisual) {
  switch (shape) {
    case "circle":
      return <circle cx="20" cy="20" r="14" fill={color} />;
    case "triangle":
      return <polygon points="20,6 34,34 6,34" fill={color} />;
    case "rect":
      return <rect x="6" y="6" width="28" height="28" rx="6" fill={color} />;
    case "star":
      return (
        <polygon
          points="20,4 24,16 37,16 26,24 30,36 20,28 10,36 14,24 3,16 16,16"
          fill={color}
        />
      );
  }
}

export function ProductIcon({ product }: { product: Product }) {
  const visual = PRODUCT_VISUAL[product.id];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <ProductGlyph shape={visual.shape} color={visual.color} />
    </svg>
  );
}
