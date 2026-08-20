import type { Metadata } from "next";
import ReactionGame from "@/games/reaction/ReactionGame";

export const metadata: Metadata = {
  title: "반응속도 테스트 | Vibecoding KGU",
  description: "초록불이 켜지는 순간 얼마나 빠르게 반응하는지 측정하는 미니게임",
};

export default function ReactionPage() {
  return <ReactionGame />;
}
