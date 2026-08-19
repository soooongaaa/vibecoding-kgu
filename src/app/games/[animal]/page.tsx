import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getZodiacGame, zodiacGames } from "@/lib/game/zodiac-games";

export function generateStaticParams() {
  return zodiacGames.map((game) => ({ animal: game.slug }));
}

export default async function ZodiacGamePage({
  params,
}: {
  params: Promise<{ animal: string }>;
}) {
  const { animal } = await params;
  const game = getZodiacGame(animal);

  if (!game) {
    notFound();
  }

  return (
    <main className={styles.page} style={{ "--accent": game.color } as React.CSSProperties}>
      <section className={styles.card}>
        <span className={styles.emoji} aria-hidden="true">{game.emoji}</span>
        <p className={styles.eyebrow}>{game.animal} GAME</p>
        <h1>{game.korean} 게임</h1>
        <p className={styles.description}>
          담당 팀원이 열심히 게임을 만들고 있어요.
          <br />
          이 경로에 완성된 미니게임이 연결될 예정입니다.
        </p>
        <div className={styles.badge}>COMING SOON</div>
        <Link href="/" className={styles.back}>← 열두 게임으로 돌아가기</Link>
      </section>
    </main>
  );
}
