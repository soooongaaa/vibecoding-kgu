"use client";

import dynamic from "next/dynamic";

const Tetris = dynamic(() => import("./Tetris"), { ssr: false });

export default function TetrisLoader() {
  return <Tetris />;
}
