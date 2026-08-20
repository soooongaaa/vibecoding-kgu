"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./pig-rps.css";

const ENGINE_SRC = "/games/pig-rps/engine/main.js";

export default function PigRpsGame() {
  useEffect(() => {
    // 엔진은 바닐라 ES 모듈이라 번들러를 거치지 않고 브라우저가 직접 받는다.
    // DOM 이 그려진 뒤에 붙여야 main.js 최상위의 getElementById 가 요소를 찾는다.
    const script = document.createElement("script");
    script.type = "module";
    script.src = ENGINE_SRC;
    document.body.appendChild(script);
    document.body.classList.add("pig-rps-body");

    return () => {
      script.remove();
      document.body.classList.remove("pig-rps-body", "revealing");
    };
  }, []);

  return (
    <>
      <div id="camWrap">
        <video id="cam" playsInline muted />
      </div>
      <canvas id="overlay" />

      <div id="hud">
        <div id="title">
          아기돼지 가위바위보
          <span>PIG RPS</span>
        </div>

        <div id="score">
          나 <b id="myScore">0</b>
          <span className="vs">VS</span>
          <b id="theirScore">0</b> 🐷
        </div>

        <div id="roundLabel">1번째 판</div>
      </div>

      <div id="countdown" />

      <div id="vsRow">
        <div className="shapeBox">
          <span className="who">나</span>
          <span className="emoji" id="myShape" />
          <span className="label" id="myLabel" />
        </div>
        <div className="shapeBox">
          <span className="who">아기돼지</span>
          <span className="emoji" id="theirShape" />
          <span className="label" id="theirLabel" />
        </div>
      </div>

      <div id="banner" />
      <div id="hint" />
      <div id="handBadge" className="off">손이 안 보여요</div>

      <div id="startOverlay" className="overlay show">
        <div className="card">
          <span className="pig-face" aria-hidden="true">🐷</span>
          <h1>아기돼지 가위바위보</h1>
          <p>
            웹캠 앞에서 <b>가위 ✌️ 바위 ✊ 보 🖐️</b> 를 내밀어<br />아기돼지와 세 판 승부를 겨뤄요.
          </p>
          <p className="fine">
            &ldquo;가위 바위 보!&rdquo; 소리에 맞춰 손을 내밀면 됩니다.<br />먼저 2승 하면 이겨요.
          </p>
          <button id="startBtn" className="btn">시작하기</button>
          <p id="startMsg">카메라 권한을 허용해주세요</p>
          <Link className="backLink" href="/">다른 동물 만나러 가기</Link>
        </div>
      </div>

      <div id="endOverlay" className="overlay">
        <div className="card">
          <span className="pig-face" aria-hidden="true">🐷</span>
          <h1 id="endTitle">이겼다!</h1>
          <p id="endDesc" />
          <button id="againBtn" className="btn">다시 하기</button>
          <Link className="backLink" href="/">다른 동물 만나러 가기</Link>
        </div>
      </div>
    </>
  );
}
