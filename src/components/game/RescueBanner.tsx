"use client";

import Link from "next/link";
import styles from "./RescueBanner.module.css";
import { getZooGame } from "@/lib/game/zoo-games";

/**
 * 게임을 깼을 때 클리어 화면에 끼워 넣는 배너.
 * 구출 기록 자체는 각 게임이 rescue(slug) 로 이미 남긴다. 여기서는 알리기만 한다.
 */
export default function RescueBanner({ slug }: { slug: string }) {
  const game = getZooGame(slug);
  if (!game) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.head}>
        <span className={styles.emoji} aria-hidden="true">{game.emoji}</span>
        <span className={styles.title}>{game.animal} 구출 성공!</span>
      </div>

      <div className={styles.hearts} aria-hidden="true">
        {["💛", "💖", "💚", "💖", "💛"].map((heart, i) => (
          <span key={i} className={styles.heart} style={{ animationDelay: `${i * 0.12}s` }}>
            {heart}
          </span>
        ))}
      </div>

      <p className={styles.sub}>철창이 열렸어요. {game.animal}가 고맙다고 인사합니다!</p>

      <Link href="/" className={styles.link}>다른 동물들도 구하러 가기 →</Link>
    </div>
  );
}
