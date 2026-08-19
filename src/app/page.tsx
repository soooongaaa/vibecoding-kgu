import Link from "next/link";
import { signOut } from "./actions";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";
import { zodiacGames } from "@/lib/game/zodiac-games";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="십이지락 홈">
          <span className={styles.brandMark}>十二</span>
          <span>
            <strong>십이지락</strong>
            <small>12 ZODIAC ARCADE</small>
          </span>
        </Link>

        {user ? (
            <form action={signOut} className={styles.account}>
              <span>{user.email}</span>
              <button type="submit">로그아웃</button>
            </form>
        ) : (
          <Link className={styles.loginButton} href="/login">
            로그인
          </Link>
        )}
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>오늘의 띠, 오늘의 승부</p>
          <h1>
            열두 동물과 함께하는
            <br />
            <span>미니게임 한 바퀴</span>
          </h1>
        </div>
        <p className={styles.intro}>
          마음에 드는 십이지신을 골라 게임을 시작하세요.
          <br />
          열두 개의 짧고 색다른 도전이 기다리고 있어요.
        </p>
      </section>

      <section className={styles.gameSection} aria-labelledby="game-list-title">
        <div className={styles.sectionHeading}>
          <h2 id="game-list-title">게임 선택</h2>
          <span>12 GAMES</span>
        </div>

        <div className={styles.gameGrid}>
          {zodiacGames.map((game, index) => (
            <Link
              href={`/games/${game.slug}`}
              className={styles.gameCard}
              style={{ "--accent": game.color } as React.CSSProperties}
              key={game.slug}
            >
              <span className={styles.order}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.emoji} aria-hidden="true">
                {game.emoji}
              </span>
              <span className={styles.gameName}>
                <strong>{game.korean}</strong>
                <small>{game.animal}</small>
              </span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>VIBECODING KGU</span>
        <span>2026 · 十二支</span>
      </footer>
    </main>
  );
}
