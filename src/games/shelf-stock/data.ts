import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = [
  { id: "beverage", label: "음료" },
  { id: "snack", label: "과자" },
  { id: "noodle", label: "라면류" },
  { id: "daily", label: "생활용품" },
];

export const PRODUCTS: Product[] = [
  { id: "cola", name: "콜라", categoryId: "beverage" },
  { id: "juice", name: "주스", categoryId: "beverage" },
  { id: "water", name: "생수", categoryId: "beverage" },
  { id: "chips", name: "감자칩", categoryId: "snack" },
  { id: "chocolate", name: "초콜릿", categoryId: "snack" },
  { id: "cookie", name: "쿠키", categoryId: "snack" },
  { id: "ramen", name: "라면", categoryId: "noodle" },
  { id: "udon", name: "우동", categoryId: "noodle" },
  { id: "jjajang", name: "짜장라면", categoryId: "noodle" },
  { id: "tissue", name: "휴지", categoryId: "daily" },
  { id: "toothbrush", name: "칫솔", categoryId: "daily" },
  { id: "battery", name: "건전지", categoryId: "daily" },
];
