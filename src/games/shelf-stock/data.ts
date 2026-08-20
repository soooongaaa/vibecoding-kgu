import type { Category, Level, Product } from "./types";

export const CATEGORIES: Category[] = [
  { id: "beverage", label: "음료" },
  { id: "snack", label: "과자" },
  { id: "noodle", label: "라면류" },
  { id: "daily", label: "생활용품" },
  { id: "fresh", label: "간편식사" },
  { id: "icecream", label: "아이스크림" },
];

/*
 * 카테고리마다 4개씩. 레벨은 이 목록에서 앞에서부터 필요한 개수만 꺼내 쓴다.
 * 따라서 각 카테고리의 앞쪽 3개는 쉬운(대표적인) 상품으로 둔다.
 */
export const PRODUCTS: Product[] = [
  { id: "cola", name: "콜라", categoryId: "beverage" },
  { id: "juice", name: "주스", categoryId: "beverage" },
  { id: "water", name: "생수", categoryId: "beverage" },
  { id: "coffee", name: "캔커피", categoryId: "beverage" },

  { id: "chips", name: "감자칩", categoryId: "snack" },
  { id: "chocolate", name: "초콜릿", categoryId: "snack" },
  { id: "cookie", name: "쿠키", categoryId: "snack" },
  { id: "jelly", name: "젤리", categoryId: "snack" },

  { id: "ramen", name: "라면", categoryId: "noodle" },
  { id: "udon", name: "우동", categoryId: "noodle" },
  { id: "jjajang", name: "짜장라면", categoryId: "noodle" },
  { id: "cupramen", name: "컵라면", categoryId: "noodle" },

  { id: "tissue", name: "휴지", categoryId: "daily" },
  { id: "toothbrush", name: "칫솔", categoryId: "daily" },
  { id: "battery", name: "건전지", categoryId: "daily" },
  { id: "mask", name: "마스크", categoryId: "daily" },

  { id: "onigiri", name: "삼각김밥", categoryId: "fresh" },
  { id: "lunchbox", name: "도시락", categoryId: "fresh" },
  { id: "sandwich", name: "샌드위치", categoryId: "fresh" },
  { id: "gimbap", name: "김밥", categoryId: "fresh" },

  { id: "cone", name: "콘", categoryId: "icecream" },
  { id: "bar", name: "바", categoryId: "icecream" },
  { id: "cupice", name: "컵아이스", categoryId: "icecream" },
  { id: "tube", name: "튜브", categoryId: "icecream" },
];

const CORE_CATEGORIES: Category["id"][] = [
  "beverage",
  "snack",
  "noodle",
  "daily",
];

const ALL_CATEGORIES: Category["id"][] = [
  ...CORE_CATEGORIES,
  "fresh",
  "icecream",
];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "오픈 준비",
    categoryIds: CORE_CATEGORIES,
    productsPerCategory: 3,
    seconds: 60,
  },
  {
    id: 2,
    name: "점심 피크",
    categoryIds: ALL_CATEGORIES,
    productsPerCategory: 3,
    seconds: 70,
  },
  {
    id: 3,
    name: "물류 대란",
    categoryIds: ALL_CATEGORIES,
    productsPerCategory: 4,
    seconds: 75,
  },
];

/** 레벨에 등장하는 상품만 추린다. */
export function productsForLevel(level: Level): Product[] {
  return level.categoryIds.flatMap((categoryId) =>
    PRODUCTS.filter((product) => product.categoryId === categoryId).slice(
      0,
      level.productsPerCategory
    )
  );
}

/** 레벨에 등장하는 카테고리만 추린다. */
export function categoriesForLevel(level: Level): Category[] {
  return level.categoryIds
    .map((id) => CATEGORIES.find((category) => category.id === id)!)
    .filter(Boolean);
}
