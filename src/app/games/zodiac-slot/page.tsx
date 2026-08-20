import type { Metadata } from "next";
import ZodiacSlot from "@/games/zodiac-slot/ZodiacSlot";

export const metadata: Metadata = {
  title: "두근두근 띠뽑기 | Vibecoding KGU",
};

export default function ZodiacSlotPage() {
  return <ZodiacSlot />;
}
