"use client";

import { useEffect, useState } from "react";
import "./wackbbu.css";

const LOGO_SRC = "/games/wackbbu/logo.png";
const ENGINE_SRC = "/games/wackbbu/engine/main.js";

export default function WackbbuGame() {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    // 엔진은 바닐라 ES 모듈이라 번들러를 거치지 않고 브라우저가 직접 받는다.
    // DOM이 이미 그려진 뒤에 붙여야 main.js 최상위의 getElementById가 요소를 찾는다.
    const script = document.createElement("script");
    script.type = "module";
    script.src = ENGINE_SRC;
    document.body.appendChild(script);

    document.body.classList.add("wackbbu-body");

    return () => {
      script.remove();
      document.body.classList.remove("wackbbu-body", "hud-off", "bonus");
    };
  }, []);

  return (
    <>
      <canvas id="scene" />
      <canvas id="overlay" />

      <div id="camWrap">
        <video id="cam" playsInline muted />
      </div>

      <div id="hud">
        <div id="logo" className={logoFailed ? "no-img" : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="logoImg"
            src={LOGO_SRC}
            alt="왁뿌숭 ASMR"
            onError={() => setLogoFailed(true)}
          />
          <span className="lg-fallback">
            <span className="lg-main">왁뿌숭</span>
            <span className="lg-sub">ASMR</span>
          </span>
        </div>

        <div id="titleBox">
          <div id="stageName" className="outlined">왁뿌숭 ASMR</div>
          <div id="stageNameEn">WAKPPUSOONG</div>
        </div>

        <div id="gauge">
          <div id="lv">LV.1</div>
          <div id="dots" />
          <div id="count">0/5</div>
        </div>
      </div>

      <div id="hint">손을 카메라에 비춰주세요</div>

      <div id="tools">
        <div id="handBadge" className="off">손이 안 보여요</div>
        <div id="soundBtn">소리: 합성</div>
        <div id="camToggle">웹캠 보기</div>
        <div id="endBtn">그만하기</div>
      </div>

      <div id="cheerLayer" />
      <div id="banner" />

      <div id="startOverlay" className="overlay show">
        <div className="card">
          {logoFailed ? (
            <h1>왁뿌숭 ASMR</h1>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="card-logo"
              src={LOGO_SRC}
              alt="왁뿌숭 ASMR"
              onError={() => setLogoFailed(true)}
            />
          )}
          <p>
            웹캠에 손을 비추고<br />손가락으로 두드리거나 주먹을 쥐어<br />왁뿌를 뿌셔보세요.
          </p>
          <p className="fine">
            소리는 전부 그 자리에서 만들어집니다.<br />오디오 파일 없이 매번 조금씩 다르게 들려요.
          </p>
          <p className="finer">
            숫자키 <b>1~6</b> 을 누르면 왁뿌를 바로 골라볼 수 있어요
          </p>
          <button id="startBtn" className="btn">시작하기</button>
          <p id="startMsg">카메라 권한을 허용해주세요</p>
        </div>
      </div>

      <div id="voteOverlay" className="overlay">
        <canvas id="votePreview" />
        <div className="card wide">
          <h1>어떤 왁뿌가 최고였나요?</h1>
          <p>
            가장 좋았던 왁뿌에 투표해주세요.<br />뽑은 왁뿌는 보너스로 한 번 더 만질 수 있어요.
          </p>
          <div className="vote-grid" id="voteGrid" />
        </div>
      </div>

      <div id="endOverlay" className="overlay">
        <div className="card">
          <h1>finish!</h1>
          <p className="end-shout">왁뿌숭!!</p>
          <p>모든 왁뿌를 다 뿌셨습니다.</p>
          <p id="endPick" />
          <button id="againBtn" className="btn">다시 하기</button>
        </div>
      </div>
    </>
  );
}
