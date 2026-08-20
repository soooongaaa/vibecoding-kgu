import type { Metadata } from "next";
import BrickBreakerLoader from "@/games/brick-breaker/BrickBreakerLoader";

export const metadata: Metadata = {
  title: "벽돌깨기 | Vibecoding KGU",
};

export default function BrickBreakerPage() {
  return <BrickBreakerLoader />;
}
