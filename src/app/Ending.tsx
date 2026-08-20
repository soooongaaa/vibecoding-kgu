"use client";

import styles from "./Ending.module.css";
import { zooGames } from "@/lib/game/zoo-games";

// 색종이 위치·속도는 렌더마다 달라지면 안 된다. 모듈 로드 시 한 번만 정한다.
// 서버에서는 이 컴포넌트를 그리지 않으므로 hydration 불일치는 생기지 않는다.
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  emoji: ["💛", "💚", "🧡", "💖", "✨", "🎉"][i % 6],
  left: (i * 37) % 100,
  delay: (i % 7) * 0.35,
  duration: 3.4 + (i % 5) * 0.5,
}));

export default function Ending({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className={styles.confetti} aria-hidden="true">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className={styles.piece}
            style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="ending-title">
        <div className={styles.card}>
          <p className={styles.eyebrow}>HAPPY ENDING</p>
          <h2 id="ending-title">모든 동물을 구출했어요!</h2>
          <p>
            철창은 이제 하나도 남지 않았어요.<br />
            열두 친구가 고맙다고 다같이 인사합니다.
          </p>

          <div className={styles.parade}>
            {zooGames.map((game, index) => (
              <span
                key={game.slug}
                className={styles.animal}
                style={{ animationDelay: `${index * 0.12}s, ${1.6 + index * 0.12}s` }}
              >
                {game.emoji}
              </span>
            ))}
          </div>

          <p>👋 &ldquo;구해줘서 고마워요!&rdquo; 👋</p>

          <button type="button" className={styles.button} onClick={onClose}>
            동물원으로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
}
