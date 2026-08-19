import type { Metadata } from "next";
import { ShelfGame } from "@/games/shelf-stock/ShelfGame";

export const metadata: Metadata = {
  title: "편의점 진열!!!",
};

export default function ShelfStockPage() {
  return <ShelfGame />;
}
