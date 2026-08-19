import type { Metadata } from "next";
import FruitShooting from "@/games/fruit-shooting/FruitShooting";

export const metadata: Metadata = {
  title: "과일 사격 | Vibecoding KGU",
};

export default function FruitShootingPage() {
  return <FruitShooting />;
}
