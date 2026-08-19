import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibecoding KGU",
  description: "경기대학교 바이브코딩 팀 프로젝트",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
