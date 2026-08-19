import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "열두 동물 놀이터",
  description: "열두 동물과 함께 즐기는 12개의 미니게임",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
