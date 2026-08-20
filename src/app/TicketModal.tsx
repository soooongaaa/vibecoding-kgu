"use client";

import { useState } from "react";
import styles from "./TicketModal.module.css";
import { zooGames } from "@/lib/game/zoo-games";
import { rescue, useRescued } from "@/lib/rescue";
import { TICKET_TOTAL, spendTicket, useTickets } from "@/lib/ticket";

export default function TicketModal({ onClose }: { onClose: () => void }) {
  const rescued = useRescued();
  const tickets = useTickets();
  const [picked, setPicked] = useState<string | null>(null);

  const caged = zooGames.filter((game) => !rescued.includes(game.slug));
  const canRescue = picked !== null && tickets > 0;

  function useTicketOn() {
    if (!picked) return;
    // 구출권을 먼저 쓴다. 실패하면 아무것도 구출하지 않는다.
    if (!spendTicket()) return;
    rescue(picked);
    setPicked(null);
    // 마지막 한 마리였다면 허브가 곧바로 엔딩을 띄운다. 그 화면을 가리지 않게 닫는다.
    if (caged.length <= 1) onClose();
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="ticket-title">
      <div className={styles.sheet}>
        <div className={styles.top}>
          <div>
            <h2 id="ticket-title">🎟️ 동물 구출권</h2>
            <p className={styles.lead}>
              구출권 한 장으로 동물 한 마리를 바로 구할 수 있어요.<br />
              구출할 친구를 고르고 구출하기를 눌러주세요.
            </p>
          </div>
          <span className={styles.count}>남은 구출권 {tickets} / {TICKET_TOTAL}장</span>
        </div>

        {caged.length === 0 ? (
          <p className={styles.empty}>이미 열두 친구를 모두 구출했어요! 🎉</p>
        ) : (
          <div className={styles.grid}>
            {zooGames.map((game) => {
              const freed = rescued.includes(game.slug);
              return (
                <button
                  key={game.slug}
                  type="button"
                  disabled={freed}
                  onClick={() => setPicked(game.slug)}
                  className={[
                    styles.pick,
                    freed ? styles.freed : "",
                    picked === game.slug ? styles.picked : "",
                  ].join(" ")}
                  style={{ "--accent": game.color } as React.CSSProperties}
                  aria-pressed={picked === game.slug}
                >
                  <span className={styles.face} aria-hidden="true">{game.emoji}</span>
                  <strong>{game.animal}</strong>
                  {freed ? <span className={styles.freedTag}>구출완료</span> : <small>{game.gameName}</small>}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onClose}>닫기</button>
          {caged.length > 0 && (
            <button type="button" className={styles.primary} disabled={!canRescue} onClick={useTicketOn}>
              {tickets === 0
                ? "구출권을 다 썼어요"
                : picked
                  ? `${zooGames.find((g) => g.slug === picked)?.animal} 구출하기`
                  : "구출할 동물을 골라주세요"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
