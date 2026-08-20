"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import Ending from "./Ending";
import TicketModal from "./TicketModal";
import { zooGames } from "@/lib/game/zoo-games";
import { clearNickname, useHydrated, useNickname } from "@/lib/nickname";
import { clearLastRescued, resetRescue, useLastRescued, useRescued } from "@/lib/rescue";
import { resetTickets, useTickets } from "@/lib/ticket";

const HEART_COUNT = 7;

export default function Home() {
  // 닉네임과 구출 기록은 localStorage 에만 있어서 서버가 알 수 없다.
  // 첫 렌더에 그리드를 그리면 서버 HTML 과 어긋나므로 hydration 후에 화면을 정한다.
  const hydrated = useHydrated();
  const nickname = useNickname();
  const rescued = useRescued();

  // 게임에서 막 돌아온 동물. 연출이 끝나면 애니메이션 종료 핸들러가 지운다.
  const justFreed = useLastRescued();

  const rescuedCount = rescued.length;
  const allRescued = rescuedCount >= zooGames.length;

  // 엔딩은 파생 상태다. 전원 구출이면 저절로 뜨고, 닫으면 다시 뜨지 않는다.
  const [endingClosed, setEndingClosed] = useState(false);
  const [replay, setReplay] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const tickets = useTickets();
  const showEnding = (allRescued && !endingClosed) || replay;

  function closeEnding() {
    setEndingClosed(true);
    setReplay(false);
  }

  function reset() {
    resetRescue();
    resetTickets();
    setEndingClosed(false);
    setReplay(false);
  }

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
          <p>철창에 갇힌 동물 친구들이 기다리고 있어요.<br />닉네임만 정하면 바로 구출을 시작할 수 있습니다.</p>
          <Link className={styles.entryButton} href="/login">동물원 입장하기 <span>→</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.sun} aria-hidden="true" />
      <div className={styles.leafLeft} aria-hidden="true">🌿</div>
      <div className={styles.leafRight} aria-hidden="true">🌿</div>

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="열두 동물 놀이터 홈">
          <span className={styles.brandMark}>ZOO</span>
          <span><strong>열두 동물 놀이터</strong><small>12 ANIMAL RESCUE</small></span>
        </Link>
        <div className={styles.account}>
          <span>{nickname} 님</span>
          <button type="button" onClick={clearNickname}>나가기</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>ANIMAL RESCUE MISSION</p>
          <h1>갇혀있는 동물들을<br /><span>구출해주세요!</span></h1>
        </div>
        <div className={styles.ticket}>
          <span>구출 현황</span>
          <strong>{rescuedCount} / {zooGames.length}</strong>
          <small>게임을 클리어하면 철창이 열려요</small>
        </div>
      </section>

      <section className={styles.gameSection} aria-labelledby="game-list-title">
        <div className={styles.rescueBar}>
          <div className={styles.rescueBarTop}>
            <span>
              열두 친구 중 <strong>{rescuedCount}</strong>마리를 구했어요
              {allRescued && " · 전원 구출 완료! 🎉"}
            </span>
            <span>
              {!allRescued && (
                <button type="button" className={styles.ticketButton} onClick={() => setTicketOpen(true)}>
                  🎟️ 구출권 {tickets}장
                </button>
              )}
              {allRescued && (
                <button type="button" className={`${styles.resetButton} ${styles.replayButton}`} onClick={() => setReplay(true)}>
                  엔딩 다시 보기
                </button>
              )}
              {rescuedCount > 0 && (
                <button type="button" className={`${styles.resetButton} ${styles.replayButton}`} onClick={reset}>
                  처음부터 다시
                </button>
              )}
            </span>
          </div>
          <div className={styles.rescueTrack}>
            <div
              className={styles.rescueFill}
              style={{ width: `${(rescuedCount / zooGames.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={rescuedCount}
              aria-valuemin={0}
              aria-valuemax={zooGames.length}
              aria-label="구출 진행도"
            />
          </div>
        </div>

        <div className={styles.sectionHeading}>
          <div><span className={styles.paw} aria-hidden="true">🐾</span><h2 id="game-list-title">동물 친구들 구출하기</h2></div>
          <p>철창을 누르면 그 친구의 게임이 시작돼요</p>
        </div>

        <div className={styles.gameGrid}>
          {zooGames.map((game, index) => {
            const freed = rescued.includes(game.slug);
            const popping = justFreed === game.slug;

            return (
              <Link
                href={game.href}
                className={[
                  styles.gameCard,
                  freed ? styles.freed : styles.caged,
                  popping ? styles.justFreed : "",
                ].join(" ")}
                style={{ "--accent": game.color } as React.CSSProperties}
                key={game.slug}
                aria-label={`${game.animal} ${game.gameName} ${freed ? "구출 완료" : "구출하러 가기"}`}
              >
                {!freed && <span className={styles.bars} aria-hidden="true" />}
                {popping && <span className={`${styles.bars} ${styles.barsOpen}`} aria-hidden="true" />}
                {!freed && <span className={styles.sos} aria-hidden="true">SOS</span>}

                {popping && (
                  <span className={styles.hearts} aria-hidden="true" onAnimationEnd={clearLastRescued}>
                    {Array.from({ length: HEART_COUNT }, (_, i) => (
                      <span
                        key={i}
                        className={styles.heart}
                        style={{ left: `${8 + i * 13}%`, animationDelay: `${i * 0.09}s` }}
                      >
                        {i % 2 === 0 ? "💛" : "💖"}
                      </span>
                    ))}
                  </span>
                )}

                <span className={styles.order}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.status}>{freed ? "구출완료" : "구출하기"}</span>
                <span className={styles.emoji} aria-hidden="true">{game.emoji}</span>
                <span className={styles.gameName}><strong>{game.animal}</strong><small>{game.gameName}</small></span>
                <span className={styles.arrow} aria-hidden="true">{freed ? "♥" : "→"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>VIBECODING KGU ZOO</span>
        <span>{allRescued ? "열두 친구가 모두 자유를 찾았어요!" : "동물 친구들을 구하러 가볼까요?"}</span>
      </footer>

      {ticketOpen && <TicketModal onClose={() => setTicketOpen(false)} />}
      {showEnding && <Ending onClose={closeEnding} />}
    </main>
  );
}
