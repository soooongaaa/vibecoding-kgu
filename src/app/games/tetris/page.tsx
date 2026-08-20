import type { Metadata } from "next";
import TetrisLoader from "@/games/tetris/TetrisLoader";

export const metadata: Metadata = {
  title: "테트리스 | Vibecoding KGU",
};

export default function TetrisPage() {
  return <TetrisLoader />;
}
