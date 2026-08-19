"use client";

import { Fragment } from "react";
import { useCookingGame } from "./useCookingGame";
import { INGREDIENT_EMOJI, MESSAGES, SPEECH, STAGES } from "./gameData";

function Plate({ stack }: { stack: { name: string; emoji: string }[] }) {
  return (
    <div className="plate-wrap">
      <div className="plate">
        {stack.map((item, index) => (
          <span key={`${item.name}-${index}`} className="stack-item" style={{ bottom: 16 + index * 20 }}>
            {item.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GamePage() {
  const game = useCookingGame();
  const stage = STAGES[game.stageIndex];
  const urgent = game.timeLeft <= 10;

  return (
    <div className="game-shell">
      <div className="stage">
        <header className="masthead">
          <div className="sign-row">
            <span className="deco" aria-hidden="true">💗</span>
            <div className="sign"><h1>미니 셰프의 주방</h1></div>
            <span className="deco" aria-hidden="true">🎀</span>
          </div>
          <p>순서를 지켜 재료를 고르세요 · 함정 재료 조심 · 단계당 60초</p>
        </header>

        <div className="kitchen">
          <div className="mascot-col">
            <div className="mascot-frame">
              <span className="crown" aria-hidden="true">👑</span>
              <span className="heart-badge" aria-hidden="true">💗</span>
              <span className="face" aria-hidden="true">🧑‍🍳</span>
            </div>
            <div className="speech" aria-live="polite">{SPEECH[game.status]}</div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div className="rail" role="list" aria-label="단계 진행 상황">
              {STAGES.map((s, i) => {
                const stubState = i < game.stageIndex ? "cleared" : i === game.stageIndex ? "current" : "locked";
                return (
                  <div className="stub" data-state={stubState} role="listitem" key={s.id}>
                    <span className="stub-num">STAGE {i + 1}</span>
                    <span className="stub-name">{stubState === "cleared" ? "✓ " : ""}{s.name}</span>
                  </div>
                );
              })}
            </div>

            <main className="ticket" aria-live="polite">
              {game.status === "idle" && (
                <div className="intro">
                  <p>
                    1단계 <strong>{STAGES[0].name}</strong>부터 순서대로 재료를 골라 요리를 완성하세요.
                    <br />
                    매 단계 시작 전 정답 순서를 3초간 보여드려요. 함정 재료를 고르거나 60초를 넘기면 1단계부터 다시 시작합니다.
                  </p>
                  <button className="cta" type="button" onClick={game.start}>시작하기 🍳</button>
                </div>
              )}

              {game.status === "preview" && (
                <>
                  <div className="ticket-head">
                    <span className="dish">
                      <small>{game.stageIndex + 1} / {game.stageCount}단계</small>
                      {stage.name}
                    </span>
                    <span className="timer">📖 {game.previewTimeLeft}</span>
                  </div>
                  <p className="preview-hint">이 순서를 잘 기억하세요!</p>
                  <div className="recipe-row">
                    {stage.correctSequence.map((name, i) => (
                      <Fragment key={`${name}-${i}`}>
                        <div className="recipe-step">
                          <span className="emoji" aria-hidden="true">{INGREDIENT_EMOJI[name]}</span>
                          <span className="label">{name}</span>
                        </div>
                        {i < stage.correctSequence.length - 1 && (
                          <span className="arrow" aria-hidden="true">→</span>
                        )}
                      </Fragment>
                    ))}
                  </div>
                </>
              )}

              {game.status === "playing" && (
                <>
                  <div className="ticket-head">
                    <span className="dish">
                      <small>{game.stageIndex + 1} / {game.stageCount}단계</small>
                      {stage.name}
                    </span>
                    <span className={`timer ${urgent ? "urgent" : ""}`}>
                      {String(game.timeLeft).padStart(2, "0")}s
                    </span>
                  </div>
                  <Plate stack={game.stack} />
                  <div className="grid" role="list" aria-label="재료 목록">
                    {game.board.map((item) => (
                      <button
                        key={item.instanceId}
                        className="tile"
                        type="button"
                        role="listitem"
                        onClick={() => game.handleSelect(item)}
                      >
                        <span className="emoji" aria-hidden="true">{item.emoji}</span>
                        <span className="label">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {game.status === "stageClear" && (
                <div className="result">
                  <span className="bubble win">✨ 완료 ✨</span>
                  <Plate stack={game.stack} />
                  <p className="result-detail">{MESSAGES.stageClear(game.clearedStage)}</p>
                </div>
              )}

              {game.status === "failed" && (
                <div className="result">
                  <span className="bubble fail">앗, 실패! 💦</span>
                  {game.stack.length > 0 && <Plate stack={game.stack} />}
                  <p className="result-detail">
                    {game.failReason === "timeout" ? MESSAGES.timeout : MESSAGES.wrongClick}
                  </p>
                  <button className="cta" type="button" onClick={game.start}>다시 시작</button>
                </div>
              )}

              {game.status === "won" && (
                <div className="result">
                  <span className="bubble win">🎉 클리어! 🎉</span>
                  <Plate stack={game.stack} />
                  <p className="result-detail">
                    {MESSAGES.win(((game.totalTimeMs ?? 0) / 1000).toFixed(1))}
                  </p>
                  <button className="cta" type="button" onClick={game.start}>다시 도전</button>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="counter" aria-hidden="true">
          <div className="pot"><span className="lid">🍯</span><div className="base" /></div>
          <div className="pot"><span className="lid">🍯</span><div className="base" /></div>
        </div>

        <footer className="note">실수하거나 시간이 다 되면 1단계부터 다시 시작합니다.</footer>
      </div>
    </div>
  );
}
