import type { Metadata } from "next";
import WhackAMole from "@/games/whack-a-mole/WhackAMole";

export const metadata: Metadata = {
  title: "두더지 잡기 | Vibecoding KGU",
  description: "구멍에서 튀어나오는 두더지를 제한시간 안에 최대한 많이 잡는 미니게임",
};

export default function WhackAMolePage() {
  return <WhackAMole />;
}
