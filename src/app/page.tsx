"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { zooGames } from "@/lib/game/zoo-games";
import { clearNickname, useHydrated, useNickname } from "@/lib/nickname";

export default function Home() {
  // 닉네임은 localStorage 에만 있어서 서버가 알 수 없다.
  // 첫 렌더에 그리드를 그리면 서버 HTML 과 어긋나므로 hydration 후에 화면을 정한다.
  const hydrated = useHydrated();
  const nickname = useNickname();

  if (!hydrated) {
    return (
      <main className={styles.welcomePage}>
        <section className={styles.welcomeCard}>
          <span className={styles.welcomeAnimals} aria-hidden="true">🐯 🐰 🐵</span>
          <p className={styles.eyebrow}>VIBECODING KGU</p>
          <h1>열두 동물 놀이터</h1>
          <p>동물원 문을 여는 중…</p>
        </section>
      </main>
    );
  }

  if (!nickname) {
    return (
      <main className={styles.welcomePage}>
        <section className={styles.welcomeCard}>
          <span className={styles.welcomeAnimals} aria-hidden="true">🐯 🐰 🐵</span>
          <p className={styles.eyebrow}>VIBECODING KGU</p>
          <h1>열두 동물 놀이터</h1>
          <p>닉네임만 정하면 바로 시작해요.<br />동물 친구들이 준비한 12개의 미니게임이 기다립니다.</p>
          <Link className={styles.entryButton} href="/login">동물원 입장하기 <span>→</span></Link>
        </section>
      </main>
    );
  }

  const openCount = zooGames.filter((game) => game.available).length;
  const soonCount = zooGames.length - openCount;

  return (
    <main className={styles.page}>
      <div className={styles.sun} aria-hidden="true" />
      <div className={styles.leafLeft} aria-hidden="true">🌿</div>
      <div className={styles.leafRight} aria-hidden="true">🌿</div>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="열두 동물 놀이터 홈">
          <span className={styles.brandMark}>ZOO</span>
          <span><strong>열두 동물 놀이터</strong><small>12 ANIMAL MINI GAMES</small></span>
        </Link>
        <div className={styles.account}>
          <span>{nickname} 님</span>
          <button type="button" onClick={clearNickname}>나가기</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>WELCOME TO OUR LITTLE ZOO</p>
          <h1>오늘은 어떤 동물과<br /><span>놀아볼까요?</span></h1>
        </div>
        <div className={styles.ticket}>
          <span>오늘의 자유이용권</span><strong>{zooGames.length} GAMES</strong><small>원하는 동물 우리를 선택하세요</small>
        </div>
      </section>

      <section className={styles.gameSection} aria-labelledby="game-list-title">
        <div className={styles.sectionHeading}>
          <div><span className={styles.paw} aria-hidden="true">🐾</span><h2 id="game-list-title">동물 친구들 만나기</h2></div>
          <p>
            <strong>{openCount}</strong>개 오픈
            {soonCount > 0 && <> · <strong>{soonCount}</strong>개 준비 중</>}
          </p>
        </div>

        <div className={styles.gameGrid}>
          {zooGames.map((game, index) => (
            <Link
              href={game.href}
              className={`${styles.gameCard} ${game.available ? styles.available : ""}`}
              style={{ "--accent": game.color } as React.CSSProperties}
              key={game.slug}
              aria-label={`${game.animal} ${game.gameName}${game.available ? " 플레이" : " 준비 중"}`}
            >
              <span className={styles.order}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.status}>{game.available ? "PLAY" : "SOON"}</span>
              <span className={styles.emoji} aria-hidden="true">{game.emoji}</span>
              <span className={styles.gameName}><strong>{game.animal}</strong><small>{game.gameName}</small></span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}><span>VIBECODING KGU ZOO</span><span>동물 친구들과 즐거운 하루 보내세요!</span></footer>
    </main>
  );
}
