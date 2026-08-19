export type CategoryId = "beverage" | "snack" | "noodle" | "daily";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
}
