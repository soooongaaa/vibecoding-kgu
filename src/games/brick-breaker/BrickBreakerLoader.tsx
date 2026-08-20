"use client";

import dynamic from "next/dynamic";

const BrickBreaker = dynamic(() => import("./BrickBreaker"), { ssr: false });

export default function BrickBreakerLoader() {
  return <BrickBreaker />;
}
