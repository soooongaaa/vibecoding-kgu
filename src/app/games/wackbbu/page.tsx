import type { Metadata } from "next";
import WackbbuGame from "@/games/wackbbu/WackbbuGame";

export const metadata: Metadata = {
  title: "왁뿌숭 ASMR",
  description: "웹캠에 비친 손으로 왁뿌를 깨는 ASMR 미니게임",
};

export default function WackbbuPage() {
  return <WackbbuGame />;
}
