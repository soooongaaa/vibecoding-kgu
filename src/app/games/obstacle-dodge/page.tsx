import type { Metadata } from "next";
import ObstacleDodge from "@/games/obstacle-dodge/ObstacleDodge";

export const metadata: Metadata = {
  title: "쓰레기 피하기 드라이브 | Vibecoding KGU",
};

export default function ObstacleDodgePage() {
  return <ObstacleDodge />;
}
