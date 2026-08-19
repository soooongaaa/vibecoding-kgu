"use client";

import { useEffect, useState } from "react";
import { ProductIcon } from "./ProductIcon";
import { DeliveryBox, PottedPlant } from "./StoreDecor";
import { useShelfGame } from "./useShelfGame";
import { setMuted, stopBgm, unlockAudio } from "./audio";
import type { CategoryId } from "./types";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  const [soundOn, setSoundOn] = useState(true);

  // 페이지를 떠날 때 BGM 이 계속 돌지 않도록 정리한다.
  useEffect(() => stopBgm, []);

  const {
    categories,
    trayProducts,
    placedByCategory,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
    phase,
    secondsLeft,
    restart,
  } = useShelfGame();

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next); // 켜는 쪽이면 이 클릭 자체가 사용자 조작이라 BGM 재생이 허용된다
  }

  function handleRestart() {
    unlockAudio();
    restart();
  }

  const timeLabel = `${Math.floor(secondsLeft / 60)}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <main className={styles.page}>
      <header className={styles.hud}>
        <h1 className={styles.title}>편의점 진열!!!</h1>

        <div className={styles.hudActions}>
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
          <span className={styles.poster} />
          <span className={styles.posterAlt} />
          <span className={styles.clock} />
        </div>

        <div className={styles.floor}>
          <PottedPlant className={styles.plantLeft} />
          <PottedPlant className={styles.plantRight} />

          <section className={styles.categories}>
            {categories.map((category) => (
              <div key={category.id} className={styles.shelfSlot}>
                <span className={styles.shelfSign}>{category.label}</span>
                <div data-category-id={category.id} className={styles.shelf}>
                  <div className={styles.placedRow}>
                    {placedByCategory[category.id].map((product) => (
                      <span
                        key={product.id}
                        className={
                          feedback?.productId === product.id && feedback.correct
                            ? styles.feedbackCorrect
                            : undefined
                        }
                      >
                        <ProductIcon product={product} />
                      </span>
                    ))}
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
              {phase === "cleared" ? "진열 완료!" : "시간 초과!"}
            </p>
            <p className={styles.overlayText}>
              {phase === "cleared"
                ? `${secondsLeft}초 남기고 성공했어요`
                : `${trayProducts.length}개를 진열하지 못했어요`}
            </p>
            <button
              type="button"
              className={styles.overlayButton}
              onClick={handleRestart}
            >
              다시 도전
            </button>
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
            <p className={styles.unboxingText}>물류 입고 중...</p>
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
    </main>
  );
}
