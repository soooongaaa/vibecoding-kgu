import type { Metadata } from "next";
import BrickBreaker from "@/games/brick-breaker/BrickBreaker";

export const metadata: Metadata = {
  title: "벽돌깨기 | Vibecoding KGU",
};

export default function BrickBreakerPage() {
  return <BrickBreaker />;
}
