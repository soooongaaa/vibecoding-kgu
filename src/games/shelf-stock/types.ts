export type CategoryId =
  | "beverage"
  | "snack"
  | "noodle"
  | "daily"
  | "fresh"
  | "icecream";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
}

export interface Level {
  id: number;
  name: string;
  /** 이 레벨에서 사용할 카테고리 */
  categoryIds: CategoryId[];
  /** 카테고리마다 몇 개의 상품을 낼지 = 진열대 칸 수 */
  productsPerCategory: number;
  seconds: number;
}
