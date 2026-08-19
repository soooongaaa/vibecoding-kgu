import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getZooGame } from "@/lib/game/zoo-games";

export default async function ComingSoonGame({ params }: { params: Promise<{ animal: string }> }) {
  const { animal } = await params;
  const game = getZooGame(animal);
  if (!game || game.available) notFound();

  return (
    <main className={styles.page} style={{ "--accent": game.color } as React.CSSProperties}>
      <section className={styles.card}>
        <span className={styles.sign}>COMING SOON</span>
        <span className={styles.emoji} aria-hidden="true">{game.emoji}</span>
        <p>{game.animal}의 우리</p><h1>{game.gameName}</h1>
        <p className={styles.description}>동물 친구가 열심히 게임을 준비하고 있어요.<br />조금만 기다려 주세요!</p>
        <Link href="/">다른 동물 만나러 가기</Link>
      </section>
    </main>
  );
}
