import type { Metadata } from "next";
import PigRpsGame from "@/games/pig-rps/PigRpsGame";

export const metadata: Metadata = {
  title: "아기돼지 가위바위보",
  description: "웹캠으로 손 모양을 인식해 아기돼지와 겨루는 가위바위보",
};

export default function PigRpsPage() {
  return <PigRpsGame />;
}
