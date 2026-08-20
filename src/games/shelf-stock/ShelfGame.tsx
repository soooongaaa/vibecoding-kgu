"use client";

import { useEffect, useState } from "react";
import { rescue } from "@/lib/rescue";
import RescueBanner from "@/components/game/RescueBanner";
import { ProductIcon } from "./ProductIcon";
import { DeliveryBox, PottedPlant } from "./StoreDecor";
import { useShelfGame } from "./useShelfGame";
import { setMuted, stopBgm, unlockAudio } from "./audio";
import { formatSeconds } from "./records";
import type { CategoryId } from "./types";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  const [soundOn, setSoundOn] = useState(true);

  // 페이지를 떠날 때 BGM 이 계속 돌지 않도록 정리한다.
  useEffect(() => stopBgm, []);

  const {
    level,
    levels,
    levelIndex,
    levelCount,
    isLastLevel,
    bestTimes,
    clearResult,
    categories,
    trayProducts,
    placedByCategory,
    slotsPerShelf,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
    phase,
    secondsLeft,
    restart,
    nextLevel,
  } = useShelfGame();

  // 게임을 깨면 허브의 동물이 철창에서 풀려난다. 게임 로직은 건드리지 않는다.
  useEffect(() => {
    if (phase === "cleared") rescue("dog");
  }, [phase]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next); // 켜는 쪽이면 이 클릭 자체가 사용자 조작이라 BGM 재생이 허용된다
  }

  function handleRestart() {
    unlockAudio();
    restart();
  }

  function handleNextLevel() {
    unlockAudio();
    nextLevel();
  }

  const timeLabel = `${Math.floor(secondsLeft / 60)}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <main className={styles.page}>
      <header className={styles.hud}>
        <h1 className={styles.title}>편의점 진열!!!</h1>

        <div className={styles.hudActions}>
          <span className={styles.levelBadge}>
            LV.{level.id} {level.name}
          </span>
          <span
            className={`${styles.timer} ${
              phase === "playing" && secondsLeft <= 10 ? styles.timerLow : ""
            }`}
          >
            ⏱ {timeLabel}
          </span>
          <button
            type="button"
            className={styles.soundButton}
            onClick={toggleSound}
            aria-label={soundOn ? "소리 끄기" : "소리 켜기"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            className={styles.restartButton}
            onClick={handleRestart}
          >
            다시하기
          </button>
        </div>
      </header>

      <div className={styles.store}>
        <div className={styles.wall} aria-hidden="true">
          <span className={styles.signBoard}>OPEN 24h</span>
          <span className={styles.lightBar} />
        </div>

        <div className={styles.floor}>
          <PottedPlant className={styles.plantLeft} />
          <PottedPlant className={styles.plantRight} />

          <section
            className={`${styles.categories} ${
              categories.length > 4 ? styles.categoriesWide : ""
            }`}
          >
            {categories.map((category) => (
              <div key={category.id} className={styles.shelfSlot}>
                <span className={styles.shelfSign}>{category.label}</span>
                <div
                  data-category-id={category.id}
                  className={styles.shelf}
                  /* 칸 수에 따라 진열대 너비와 그리드 열이 함께 정해진다 */
                  style={{ "--slots": slotsPerShelf } as React.CSSProperties}
                >
                  <div className={styles.slots}>
                    {Array.from({ length: slotsPerShelf }, (_, index) => {
                      const product = placedByCategory[category.id][index];
                      return (
                        <div
                          key={index}
                          className={`${styles.slot} ${
                            product ? "" : styles.slotEmpty
                          }`}
                        >
                          {product && (
                            <span
                              className={
                                feedback?.productId === product.id &&
                                feedback.correct
                                  ? styles.feedbackCorrect
                                  : undefined
                              }
                            >
                              <ProductIcon product={product} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>

        {(phase === "cleared" || phase === "failed") && (
          <div className={styles.overlay}>
            <p
              className={`${styles.overlayTitle} ${
                phase === "cleared" ? styles.overlayWin : styles.overlayLose
              }`}
            >
              {phase === "cleared"
                ? isLastLevel
                  ? "전체 클리어!"
                  : `LV.${level.id} 클리어!`
                : "시간 초과!"}
            </p>
            {phase === "cleared" && clearResult ? (
              <p className={styles.overlayText}>
                기록 {formatSeconds(clearResult.seconds)}
                {clearResult.isRecord ? (
                  <span className={styles.recordTag}>🏆 신기록!</span>
                ) : (
                  <span className={styles.recordPrev}>
                    최단 {formatSeconds(bestTimes[level.id]!)}
                  </span>
                )}
              </p>
            ) : (
              <p className={styles.overlayText}>
                {trayProducts.length}개를 진열하지 못했어요
              </p>
            )}
            <div className={styles.overlayButtons}>
              {phase === "cleared" && (
                <button
                  type="button"
                  className={styles.overlayButton}
                  onClick={handleNextLevel}
                >
                  {isLastLevel ? "처음부터" : `LV.${level.id + 1} 도전`}
                </button>
              )}
              <button
                type="button"
                className={`${styles.overlayButton} ${
                  phase === "cleared" ? styles.overlayButtonSub : ""
                }`}
                onClick={handleRestart}
              >
                다시 도전
              </button>
            </div>
            {phase === "cleared" && <RescueBanner slug="dog" />}
          </div>
        )}
      </div>

      <section
        className={`${styles.tray} ${
          phase === "playing" ? "" : styles.trayIdle
        }`}
      >
        {phase === "unboxing" ? (
          <div className={styles.unboxing}>
            <div className={styles.boxRow} aria-hidden="true">
              <DeliveryBox
                className={styles.box}
                flapLeftClassName={styles.flapLeft}
                flapRightClassName={styles.flapRight}
              />
              <DeliveryBox
                className={styles.box}
                flapLeftClassName={styles.flapLeft}
                flapRightClassName={styles.flapRight}
              />
              <DeliveryBox
                className={styles.box}
                flapLeftClassName={styles.flapLeft}
                flapRightClassName={styles.flapRight}
              />
            </div>
            <p className={styles.unboxingText}>
              LV.{level.id} {level.name} — 물류 입고 중...
            </p>
          </div>
        ) : (
          trayProducts.map((product) => {
            const isDragging = dragging?.productId === product.id;
            return (
              <div
                key={product.id}
                className={`${styles.productChip} ${
                  isDragging ? styles.dragging : ""
                } ${
                  feedback?.productId === product.id
                    ? feedback.correct
                      ? styles.feedbackCorrect
                      : styles.feedbackWrong
                    : ""
                }`}
                style={
                  isDragging ? { left: dragging.x, top: dragging.y } : undefined
                }
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  unlockAudio(); // 첫 조작 시점에 오디오를 깨워 BGM 을 시작한다
                  startDrag(product.id, e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (dragging?.productId === product.id) {
                    moveDrag(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={(e) => {
                  const el = document.elementFromPoint(e.clientX, e.clientY);
                  const categoryEl = el?.closest<HTMLElement>(
                    "[data-category-id]"
                  );
                  const categoryId = categoryEl?.dataset
                    .categoryId as CategoryId | undefined;
                  attemptPlace(product.id, categoryId ?? null);
                }}
                onPointerCancel={() => attemptPlace(product.id, null)}
              >
                <ProductIcon product={product} />
                <span className={styles.productName}>{product.name}</span>
              </div>
            );
          })
        )}
      </section>

      <div className={styles.levelDots} aria-hidden="true">
        {Array.from({ length: levelCount }, (_, index) => (
          <span
            key={index}
            className={`${styles.levelDot} ${
              index === levelIndex ? styles.levelDotOn : ""
            }`}
          />
        ))}
      </div>

      {/* 모바일에서는 플레이 중에 접어 두어 진열대와 트레이가 한 화면에 들어오게 한다 */}
      <section
        className={`${styles.records} ${
          phase === "playing" || phase === "unboxing"
            ? styles.recordsDuringPlay
            : ""
        }`}
      >
        <h2 className={styles.recordsTitle}>🏆 최단기록</h2>
        <div className={styles.recordList}>
          {levels.map((item) => {
            const best = bestTimes[item.id];
            return (
              <div
                key={item.id}
                className={`${styles.recordCard} ${
                  item.id === level.id ? styles.recordCardOn : ""
                }`}
              >
                <span className={styles.recordLevel}>LV.{item.id}</span>
                <span className={styles.recordName}>{item.name}</span>
                <span
                  className={`${styles.recordTime} ${
                    best === undefined ? styles.recordTimeEmpty : ""
                  }`}
                >
                  {best === undefined ? "기록 없음" : formatSeconds(best)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
