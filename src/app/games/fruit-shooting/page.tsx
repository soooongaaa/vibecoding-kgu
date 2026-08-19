import type { Metadata } from "next";
import ClayShooting from "@/games/clay-shooting/ClayShooting";

export const metadata: Metadata = {
  title: "클레이 사격 | Vibecoding KGU",
};

export default function ClayShootingPage() {
  return <ClayShooting />;
}
