import type { Metadata } from "next";
import CheeseCircuit from "@/games/cheese-circuit/CheeseCircuit";

export const metadata: Metadata = {
  title: "치즈 미로 | Vibecoding KGU",
};

export default function CheeseCircuitPage() {
  return <CheeseCircuit />;
}
