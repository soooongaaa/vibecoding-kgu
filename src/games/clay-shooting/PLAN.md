# 클레이 사격 (clay-shooting) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `feature/game-joyuni-a` 브랜치에 `/games/clay-shooting` 클레이 사격 미니게임을 프론트엔드만으로 완성한다 (시작→플레이→종료→통과/실패 결과→다시 하기).

**Architecture:** `src/games/brick-breaker/`(이미 `dev`에 병합된 선례)와 동일한 패턴 — 물리·판정은 `engine.ts`의 순수 함수로 분리하고, `ClayShooting.tsx`가 `requestAnimationFrame` 루프 안에서 그 함수들을 호출해 refs 기반 mutable 상태를 굴린다. HUD 표시용으로만 React state를 쓴다. 백엔드/DB는 없다.

**Tech Stack:** Next.js 16 (App Router, TypeScript), Canvas 2D API, CSS Modules. 새 의존성 추가 없음.

**Spec:** `src/games/clay-shooting/SPEC.md` (commit c204d54)

## Global Constraints

- 캔버스 크기: 900×600
- 제한시간: 60000ms (60초)
- 스폰 간격: 3000ms마다 클레이 2개(좌/우 동시)
- 통과 기준: 60초 안에 명중 20개 이상 (`PASS_THRESHOLD = 20`)
- 백엔드/API/Supabase 테이블: 만들지 않는다 (SPEC.md "범위 밖" 참고)
- 자동화 테스트 프레임워크 없음 — 레포에 jest/vitest 등이 없고, 추가하려면 `package.json` 수정이 필요해 팀 CLAUDE.md 규칙("패키지 설정 변경이 필요하면 구현을 멈추고 팀장에게 먼저 알린다")에 걸린다. 이 계획의 각 태스크는 자동 테스트 대신 **읽기 기반 수동 검증**(순수 함수는 예시 입력/출력 대조) + **브라우저 수동 플레이 검증**으로 대체한다. 이건 SPEC.md에서 이미 사용자 승인을 받은 결정이다.
- 수정 허용 범위: `src/games/clay-shooting/**`, `src/app/games/clay-shooting/**`만. 그 외 파일은 건드리지 않는다.
- 커밋은 작은 단위로, 태스크마다 1커밋.

---

### Task 1: `engine.ts` 순수 함수 (스폰, 물리, 히트테스트, 통과 판정)

**Files:**
- Create: `src/games/clay-shooting/engine.ts`

**Interfaces:**
- Produces: `ClayTarget` 타입, `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `GAME_DURATION_MS`, `SPAWN_INTERVAL_MS`, `PASS_THRESHOLD` 상수, `createClayPair(nextId: number): ClayTarget[]`, `stepTarget(target: ClayTarget): ClayTarget`, `isOffscreen(target: ClayTarget): boolean`, `isHit(target: ClayTarget, pointX: number, pointY: number): boolean`, `isPass(hitCount: number): boolean` — 이후 Task 3(`ClayShooting.tsx`)이 이 이름과 시그니처 그대로 소비한다.

- [ ] **Step 1: `engine.ts` 작성**

```ts
export type ClayTarget = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const GAME_DURATION_MS = 60_000;
export const SPAWN_INTERVAL_MS = 3_000;
export const PASS_THRESHOLD = 20;

const GRAVITY = 0.25;
const LAUNCH_VY = -13;
const LAUNCH_VX = 6;
const TARGET_RADIUS = 24;
const GROUND_Y = CANVAS_HEIGHT - 20;
const LEFT_SPAWN_X = 100;
const RIGHT_SPAWN_X = CANVAS_WIDTH - 100;

export function createClayPair(nextId: number): ClayTarget[] {
  return [
    {
      id: nextId,
      x: LEFT_SPAWN_X,
      y: GROUND_Y,
      vx: LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
    },
    {
      id: nextId + 1,
      x: RIGHT_SPAWN_X,
      y: GROUND_Y,
      vx: -LAUNCH_VX,
      vy: LAUNCH_VY,
      radius: TARGET_RADIUS,
    },
  ];
}

export function stepTarget(target: ClayTarget): ClayTarget {
  return {
    ...target,
    x: target.x + target.vx,
    y: target.y + target.vy,
    vy: target.vy + GRAVITY,
  };
}

export function isOffscreen(target: ClayTarget): boolean {
  return (
    target.y - target.radius > CANVAS_HEIGHT ||
    target.x + target.radius < 0 ||
    target.x - target.radius > CANVAS_WIDTH
  );
}

export function isHit(
  target: ClayTarget,
  pointX: number,
  pointY: number,
): boolean {
  const dx = target.x - pointX;
  const dy = target.y - pointY;
  return Math.sqrt(dx * dx + dy * dy) <= target.radius;
}

export function isPass(hitCount: number): boolean {
  return hitCount >= PASS_THRESHOLD;
}
```

- [ ] **Step 2: 수동 검증 (자동 테스트 러너 없음 — 코드를 읽으며 아래 예상값과 대조)**

  - `createClayPair(1)` → `[{id:1, x:100, y:580, vx:6, vy:-13, radius:24}, {id:2, x:800, y:580, vx:-6, vy:-13, radius:24}]`
  - `stepTarget({id:1, x:100, y:580, vx:6, vy:-13, radius:24})` → `{id:1, x:106, y:567, vx:6, vy:-12.75, radius:24}`
  - `isOffscreen({id:1, x:100, y:601, vx:0, vy:0, radius:24})` → `false` (601-24=577 < 600) / `isOffscreen({..., y:625, radius:24})` → `true` (625-24=601 > 600)
  - `isHit({id:1, x:100, y:580, radius:24}, 100, 580)` → `true` (거리 0)
  - `isHit({id:1, x:100, y:580, radius:24}, 200, 580)` → `false` (거리 100 > 24)
  - `isPass(19)` → `false`, `isPass(20)` → `true`

  코드를 실행해 위 값이 실제로 나오는지 확인할 자동화 도구가 없으므로, 각 함수를 직접 손으로 따라가며(산수 계산) 위 값과 일치하는지 확인한다. 일치하지 않으면 함수를 고친다.

- [ ] **Step 3: 커밋**

```bash
git add src/games/clay-shooting/engine.ts
git commit -m "feat: clay-shooting 물리/판정 순수함수 추가"
```

---

### Task 2: `ClayShooting.module.css`

**Files:**
- Create: `src/games/clay-shooting/ClayShooting.module.css`

**Interfaces:**
- Produces: CSS Module 클래스 `wrap`, `title`, `hud`, `canvasBox`, `canvas`, `overlay`, `result`, `button` — Task 3이 `styles.<name>`으로 그대로 참조한다.

- [ ] **Step 1: CSS 작성 (`src/games/brick-breaker/BrickBreaker.module.css`와 같은 톤, 캔버스 비율만 900:600으로 변경, 사격 게임이라 커서를 crosshair로)**

```css
.wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: #0f172a;
  color: #f8fafc;
}

.title {
  margin: 0;
  font-size: 22px;
}

.hud {
  display: flex;
  gap: 20px;
  font-weight: 700;
  font-size: 14px;
}

.canvasBox {
  position: relative;
  width: 100%;
  max-width: 900px;
  aspect-ratio: 900 / 600;
}

.canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 12px;
  touch-action: none;
  cursor: crosshair;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 12px;
  text-align: center;
  padding: 24px;
}

.result {
  font-size: 18px;
  font-weight: 700;
}

.button {
  border: 0;
  border-radius: 10px;
  padding: 12px 20px;
  background: #38bdf8;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/clay-shooting/ClayShooting.module.css
git commit -m "style: clay-shooting CSS 모듈 추가"
```

---

### Task 3: `ClayShooting.tsx` 게임 본체

**Files:**
- Create: `src/games/clay-shooting/ClayShooting.tsx`

**Interfaces:**
- Consumes: Task 1의 `engine.ts` 전체 export, Task 2의 `ClayShooting.module.css` 클래스명
- Produces: `export default function ClayShooting()` — Task 4의 `page.tsx`가 `import ClayShooting from "@/games/clay-shooting/ClayShooting"`로 사용한다.

- [ ] **Step 1: 컴포넌트 작성**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ClayShooting.module.css";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_DURATION_MS,
  SPAWN_INTERVAL_MS,
  PASS_THRESHOLD,
  type ClayTarget,
  createClayPair,
  stepTarget,
  isOffscreen,
  isHit,
  isPass,
} from "./engine";

type Phase = "ready" | "playing" | "cleared" | "failed";

export default function ClayShooting() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hitCount, setHitCount] = useState(0);
  const [remainingMs, setRemainingMs] = useState(GAME_DURATION_MS);

  const phaseRef = useRef<Phase>("ready");
  const targetsRef = useRef<ClayTarget[]>([]);
  const nextIdRef = useRef(0);
  const hitCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  const resetGame = useCallback(() => {
    targetsRef.current = [];
    nextIdRef.current = 0;
    hitCountRef.current = 0;
    elapsedRef.current = 0;
    lastSpawnRef.current = 0;
    lastFrameTimeRef.current = null;
    setHitCount(0);
    setRemainingMs(GAME_DURATION_MS);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    phaseRef.current = "playing";
    setPhase("playing");
  }, [resetGame]);

  const shootAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || phaseRef.current !== "playing") return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const pointX = (clientX - rect.left) * scaleX;
    const pointY = (clientY - rect.top) * scaleY;

    const targets = targetsRef.current;
    const hitIndex = targets.findIndex((target) =>
      isHit(target, pointX, pointY),
    );
    if (hitIndex === -1) return;

    targets.splice(hitIndex, 1);
    hitCountRef.current += 1;
    setHitCount(hitCountRef.current);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      shootAt(e.clientX, e.clientY);
    },
    [shootAt],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

      for (const target of targetsRef.current) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#7c2d12";
        ctx.stroke();
      }
    };

    const step = (time: number) => {
      if (phaseRef.current !== "playing") {
        lastFrameTimeRef.current = null;
        draw();
        animationId = requestAnimationFrame(step);
        return;
      }

      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }
      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      elapsedRef.current += delta;
      setRemainingMs(Math.max(0, GAME_DURATION_MS - elapsedRef.current));

      if (elapsedRef.current - lastSpawnRef.current >= SPAWN_INTERVAL_MS) {
        lastSpawnRef.current += SPAWN_INTERVAL_MS;
        const pair = createClayPair(nextIdRef.current);
        nextIdRef.current += 2;
        targetsRef.current.push(...pair);
      }

      targetsRef.current = targetsRef.current
        .map(stepTarget)
        .filter((target) => !isOffscreen(target));

      if (elapsedRef.current >= GAME_DURATION_MS) {
        const cleared = isPass(hitCountRef.current);
        phaseRef.current = cleared ? "cleared" : "failed";
        setPhase(cleared ? "cleared" : "failed");
      }

      draw();
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>클레이 사격</h1>

      <div className={styles.hud}>
        <span>남은 시간: {remainingSeconds}초</span>
        <span>
          명중: {hitCount} / {PASS_THRESHOLD}
        </span>
      </div>

      <div className={styles.canvasBox}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
        />

        {phase === "ready" && (
          <div className={styles.overlay}>
            <p>
              화면을 클릭해서 날아오르는 클레이를 맞추세요.
              <br />
              60초 안에 {PASS_THRESHOLD}개 이상 명중하면 통과!
            </p>
            <button className={styles.button} onClick={startGame}>
              시작하기
            </button>
          </div>
        )}

        {phase === "cleared" && (
          <div className={styles.overlay}>
            <p className={styles.result}>통과! 명중 {hitCount}개</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}

        {phase === "failed" && (
          <div className={styles.overlay}>
            <p className={styles.result}>실패. 명중 {hitCount}개</p>
            <button className={styles.button} onClick={startGame}>
              다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/games/clay-shooting/ClayShooting.tsx
git commit -m "feat: clay-shooting 게임 컴포넌트 구현"
```

---

### Task 4: 라우트 진입 파일

**Files:**
- Create: `src/app/games/clay-shooting/page.tsx`

**Interfaces:**
- Consumes: Task 3의 `export default function ClayShooting()` (import 경로 `@/games/clay-shooting/ClayShooting`)

- [ ] **Step 1: `page.tsx` 작성 (`src/app/games/brick-breaker/page.tsx`와 동일 패턴)**

```tsx
import type { Metadata } from "next";
import ClayShooting from "@/games/clay-shooting/ClayShooting";

export const metadata: Metadata = {
  title: "클레이 사격 | Vibecoding KGU",
};

export default function ClayShootingPage() {
  return <ClayShooting />;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/games/clay-shooting/page.tsx
git commit -m "feat: clay-shooting 라우트 연결"
```

---

### Task 5: 검증 (lint, build, 수동 플레이)

**Files:** 없음 (검증만 수행)

- [ ] **Step 1: 의존성 설치 (아직 안 했다면)**

Run: `npm install`

- [ ] **Step 2: lint 실행**

Run: `npm run lint`
Expected: 에러 없이 통과. 에러가 있으면 해당 파일만 고친다 (다른 파일 건드리지 않기).

- [ ] **Step 3: build 실행**

Run: `npm run build`
Expected: 타입 에러/빌드 에러 없이 성공.

- [ ] **Step 4: 로컬 실행 후 브라우저에서 직접 플레이**

Run: `npm run dev`, 브라우저에서 `http://localhost:3000/games/clay-shooting` 접속.

확인 항목:
- "시작하기" 클릭 → 60초 타이머가 줄어들고, 약 3초 간격으로 클레이 2개가 하단 좌/우에서 포물선으로 날아오르는지.
- 클레이를 클릭하면 사라지고 "명중" 숫자가 올라가는지.
- 화면 밖으로 나간 클레이는 그냥 사라지고 명중 수가 줄지 않는지.
- 60초가 지나면 명중 수에 따라 "통과" 또는 "실패" 화면이 뜨는지 (한 번은 20개 이상 맞혀서 통과 확인, 한 번은 거의 안 맞고 실패 확인).
- "다시 하기"를 누르면 타이머·명중 수·클레이가 모두 초기화되고 재시작되는지.
- 브라우저 개발자 도구 Console에 에러가 없는지.
- 브라우저 창 폭을 줄이거나 모바일 에뮬레이션(DevTools)에서도 캔버스가 반응형으로 줄어들고 탭으로 명중 판정이 되는지.

- [ ] **Step 5: 변경 범위 확인**

Run: `git diff dev --stat`
Expected: `src/games/clay-shooting/`와 `src/app/games/clay-shooting/` 아래 파일만 나와야 한다 (SPEC.md, PLAN.md 포함). 다른 경로가 보이면 실수로 건드린 것이니 되돌린다.

- [ ] **Step 6: 커밋 (검증 자체는 커밋할 코드 변경이 없으므로 생략 — 통과 확인만 하고 다음 단계로)**

---

## 완료 후

이 계획의 모든 태스크가 끝나면 `feature/game-joyuni-a`에는 커밋된 변경사항만 있고 아직 push되지 않은 상태다. `dev`로의 PR 생성·push는 이 문서의 범위가 아니며, 팀 CLAUDE.md·`/game-finish` 규칙대로 **사용자에게 변경 요약과 테스트 결과를 보여주고 명시적 승인을 받은 뒤에만** 진행한다.
