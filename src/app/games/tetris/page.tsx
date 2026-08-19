import type { Metadata } from "next";
import Tetris from "@/games/tetris/Tetris";

export const metadata: Metadata = {
  title: "테트리스 | Vibecoding KGU",
};

export default function TetrisPage() {
  return <Tetris />;
}
