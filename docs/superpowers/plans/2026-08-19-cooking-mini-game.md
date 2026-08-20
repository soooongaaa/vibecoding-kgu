# 요리 미니게임 (Cooking Mini-Game) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/game` route to the vibecoding-kgu Next.js app implementing a 3-stage, click-to-order cooking matching puzzle (hot dog → sandwich → gimbap), 60s per stage, restart-from-stage-1 on any mistake/timeout, with the final total clear time shown on screen.

**Architecture:** Pure client-side feature, no server/database involvement. Three colocated files under `src/app/game/`: a data module (recipe content + pure helpers), a state-machine hook (timer + click validation), and the page component (rendering only). Reuses the app's existing plain-CSS design system (`globals.css`) with a few added classes.

**Tech Stack:** Next.js App Router, React (client component), TypeScript. No new dependencies, no new Supabase tables (persistence was explicitly descoped from v1 — see spec §9).

**Spec:** [`dbpq8009-a-SPEC.md`](../../../dbpq8009-a-SPEC.md)

## Global Constraints

- No new npm dependencies and no new Supabase tables/migrations (spec §6).
- PC (desktop) only — no mobile-specific layout work (spec §4).
- Game must be playable regardless of login state; no auth check on this page (spec §2).
- New route only (`/game`); do **not** add a link from `src/app/page.tsx` or modify any other existing file (spec §4).
- Deadline: today, 2026-08-19 (spec §6).
- **Git:** never run `git add` / `git commit` / `git push` or any other git command as part of this plan — the user runs those explicitly when ready. Every task below ends with "leave the change staged in the working tree", not a commit step.
- **Testing approach (deviation from the writing-plans default):** the project has no test runner configured (`package.json` has no `test` script, no Jest/Vitest dependency), and the spec's own Definition of Done (§7) is manual verification via `npm run dev`, explicitly excluding build/lint. Adding a test framework is out of scope for a same-day feature with no existing test infrastructure to extend. Each task below is still self-contained and independently checkable, just via a manual dev-server check instead of an automated test.

---

## Task 1: Game content & pure helpers (`gameData.ts`)

**Files:**
- Create: `src/app/game/gameData.ts`

**Interfaces:**
- Produces: `Stage` type, `BoardItem` type, `STAGES: Stage[]`, `STAGE_TIME_LIMIT_SECONDS: number`, `MESSAGES` object, `buildBoard(stage: Stage): BoardItem[]` — all consumed by Task 2's hook.

- [ ] **Step 1: Write `src/app/game/gameData.ts`**

```typescript
export type Stage = {
  id: number;
  name: string;
  correctSequence: string[];
  decoyNames: string[];
};

export type BoardItem = {
  instanceId: string;
  name: string;
  emoji: string;
  isDecoy: boolean;
};

export const STAGE_TIME_LIMIT_SECONDS = 60;

const INGREDIENT_EMOJI: Record<string, string> = {
  "핫도그 빵": "🥖",
  소세지: "🌭",
  머스타드: "🧴",
  케첩: "🍅",
  치즈: "🧀",
  빵: "🥖",
  딸기잼: "🍓",
  상추: "🥬",
  햄: "🍖",
  블루베리잼: "🫐",
  베이컨: "🥓",
  김: "🟩",
  밥: "🍚",
  단무지: "🟨",
  우엉: "🟫",
  당근: "🥕",
  오이: "🥒",
  계란: "🥚",
  참치: "🐟",
};

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "핫도그",
    correctSequence: ["핫도그 빵", "소세지", "머스타드"],
    decoyNames: ["케첩", "치즈"],
  },
  {
    id: 2,
    name: "샌드위치",
    correctSequence: ["빵", "딸기잼", "상추", "햄", "빵"],
    decoyNames: ["블루베리잼", "베이컨", "치즈"],
  },
  {
    id: 3,
    name: "김밥",
    correctSequence: ["김", "밥", "단무지", "우엉", "당근", "오이"],
    decoyNames: ["치즈", "계란", "참치"],
  },
];

export const MESSAGES = {
  wrongClick: "❌ 함정 재료예요! 처음부터 다시 도전해 보세요.",
  timeout: "⏰ 시간 초과! 처음부터 다시 도전해 보세요.",
  stageClear: (clearedStageNumber: number) =>
    `✅ ${clearedStageNumber}단계 완료! 다음 단계로 이동합니다.`,
  win: (totalSeconds: string) => `🎉 미션 클리어! 총 소요시간: ${totalSeconds}초`,
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildBoard(stage: Stage): BoardItem[] {
  const correctItems: BoardItem[] = stage.correctSequence.map((name, index) => ({
    instanceId: `correct-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: false,
  }));
  const decoyItems: BoardItem[] = stage.decoyNames.map((name, index) => ({
    instanceId: `decoy-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: true,
  }));
  return shuffle([...correctItems, ...decoyItems]);
}
```

- [ ] **Step 2: Manual check**

Run: `npx tsc --noEmit` (uses the repo's existing `tsconfig.json`)
Expected: no errors mentioning `src/app/game/gameData.ts`

- [ ] **Step 3: Leave staged** — do not run any git command; move to Task 2.

---

## Task 2: Game state hook (`useCookingGame.ts`)

**Files:**
- Create: `src/app/game/useCookingGame.ts`

**Interfaces:**
- Consumes: `Stage`, `BoardItem`, `STAGES`, `STAGE_TIME_LIMIT_SECONDS`, `buildBoard` from `./gameData` (Task 1).
- Produces: `useCookingGame()` hook returning `{ status, failReason, stageIndex, stageCount, currentStageName, board, timeLeft, clearedStage, totalTimeMs, start, handleSelect }` — consumed by Task 4's page component. `status` is one of `"idle" | "playing" | "stageClear" | "failed" | "won"`.

- [ ] **Step 1: Write `src/app/game/useCookingGame.ts`**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { BoardItem, STAGES, STAGE_TIME_LIMIT_SECONDS, buildBoard } from "./gameData";

type Status = "idle" | "playing" | "stageClear" | "failed" | "won";
type FailReason = "wrong" | "timeout" | null;

export function useCookingGame() {
  const [status, setStatus] = useState<Status>("idle");
  const [failReason, setFailReason] = useState<FailReason>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT_SECONDS);
  const [clearedStage, setClearedStage] = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number | null>(null);
  const gameStartRef = useRef<number | null>(null);

  function start() {
    gameStartRef.current = Date.now();
    setStageIndex(0);
    setBoard(buildBoard(STAGES[0]));
    setProgress(0);
    setTimeLeft(STAGE_TIME_LIMIT_SECONDS);
    setFailReason(null);
    setTotalTimeMs(null);
    setStatus("playing");
  }

  function handleSelect(item: BoardItem) {
    if (status !== "playing") return;
    const stage = STAGES[stageIndex];
    const expectedName = stage.correctSequence[progress];

    if (item.isDecoy || item.name !== expectedName) {
      setFailReason("wrong");
      setStatus("failed");
      return;
    }

    setBoard((prev) => prev.filter((entry) => entry.instanceId !== item.instanceId));
    const nextProgress = progress + 1;

    if (nextProgress < stage.correctSequence.length) {
      setProgress(nextProgress);
      return;
    }

    // stage cleared
    if (stageIndex === STAGES.length - 1) {
      const start = gameStartRef.current ?? Date.now();
      setTotalTimeMs(Date.now() - start);
      setStatus("won");
      return;
    }

    const nextIndex = stageIndex + 1;
    setStageIndex(nextIndex);
    setBoard(buildBoard(STAGES[nextIndex]));
    setProgress(0);
    setTimeLeft(STAGE_TIME_LIMIT_SECONDS);
    setClearedStage(stageIndex + 1);
    setStatus("stageClear");
  }

  // countdown timer, active only while playing
  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setFailReason("timeout");
          setStatus("failed");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // brief "stage cleared" pause before resuming play on the next stage
  useEffect(() => {
    if (status !== "stageClear") return;
    const timeout = setTimeout(() => setStatus("playing"), 1000);
    return () => clearTimeout(timeout);
  }, [status]);

  return {
    status,
    failReason,
    stageIndex,
    stageCount: STAGES.length,
    currentStageName: STAGES[stageIndex].name,
    board,
    timeLeft,
    clearedStage,
    totalTimeMs,
    start,
    handleSelect,
  };
}
```

- [ ] **Step 2: Manual check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `src/app/game/useCookingGame.ts`

- [ ] **Step 3: Leave staged** — do not run any git command; move to Task 3.

---

## Task 3: Game-specific styles

**Files:**
- Modify: `src/app/globals.css` (append at end of file)

**Interfaces:**
- Produces: CSS classes `.game-card`, `.stage-info`, `.timer`, `.ingredient-grid`, `.ingredient-btn`, `.ingredient-emoji`, `.ingredient-label` — consumed by Task 4's page markup.

- [ ] **Step 1: Append to `src/app/globals.css`**

```css

.game-card { width: min(100%, 720px); }
.stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 16px;
  font-weight: 700;
}
.timer { color: #b42318; }
.ingredient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}
.ingredient-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #eef2ff;
  color: #3730a3;
  padding: 14px 8px;
}
.ingredient-emoji { font-size: 32px; }
.ingredient-label { font-size: 13px; font-weight: 700; }
```

- [ ] **Step 2: Manual check** — open the file and confirm the appended block is syntactically valid CSS (matching braces, no stray characters); no build step needed yet since no page references these classes until Task 4.

- [ ] **Step 3: Leave staged** — do not run any git command; move to Task 4.

---

## Task 4: Game page (`page.tsx`)

**Files:**
- Create: `src/app/game/page.tsx`

**Interfaces:**
- Consumes: `useCookingGame` (Task 2), `MESSAGES`, `STAGES` (Task 1), CSS classes from Task 3.
- Produces: the `/game` route.

- [ ] **Step 1: Write `src/app/game/page.tsx`**

```tsx
"use client";

import { useCookingGame } from "./useCookingGame";
import { MESSAGES, STAGES } from "./gameData";

export default function GamePage() {
  const game = useCookingGame();

  return (
    <main className="page">
      <section className="card game-card">
        <h1>요리 미니게임</h1>

        {game.status === "idle" && (
          <>
            <p>
              1단계 {STAGES[0].name}부터 순서대로 재료를 클릭해 요리를 완성하세요.
              함정 재료를 클릭하거나 60초를 넘기면 1단계부터 다시 시작합니다.
            </p>
            <button onClick={game.start}>시작</button>
          </>
        )}

        {game.status === "playing" && (
          <>
            <div className="stage-info">
              <span>{game.stageIndex + 1}/{game.stageCount}단계 · {game.currentStageName}</span>
              <span className="timer">⏱ {game.timeLeft}초</span>
            </div>
            <div className="ingredient-grid">
              {game.board.map((item) => (
                <button
                  key={item.instanceId}
                  className="ingredient-btn"
                  onClick={() => game.handleSelect(item)}
                >
                  <span className="ingredient-emoji">{item.emoji}</span>
                  <span className="ingredient-label">{item.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {game.status === "stageClear" && (
          <div className="message success">{MESSAGES.stageClear(game.clearedStage)}</div>
        )}

        {game.status === "failed" && (
          <>
            <div className="message error">
              {game.failReason === "timeout" ? MESSAGES.timeout : MESSAGES.wrongClick}
            </div>
            <button onClick={game.start}>다시 시작</button>
          </>
        )}

        {game.status === "won" && (
          <>
            <div className="message success">
              {MESSAGES.win(((game.totalTimeMs ?? 0) / 1000).toFixed(1))}
            </div>
            <button onClick={game.start}>다시 도전</button>
          </>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Manual check**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `src/app/game/page.tsx`

- [ ] **Step 3: Leave staged** — do not run any git command; move to Task 5.

---

## Task 5: End-to-end manual verification against the spec's Definition of Done

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts without errors, listening on `http://localhost:3000`

- [ ] **Step 2: Walk the spec §7 checklist at `http://localhost:3000/game`**

- [ ] 1→2→3단계 순서대로 플레이 가능 (핫도그 → 샌드위치 → 김밥, 정답 순서대로 클릭하면 진행)
- [ ] 함정 재료를 클릭하면 즉시 실패 메시지가 뜨고 "다시 시작"으로 1단계부터 재시작됨
- [ ] 60초를 넘기면 시간 초과 메시지가 뜨고 1단계부터 재시작됨
- [ ] 3단계(김밥)를 클리어하면 총 소요시간이 초 단위로 표시됨
- [ ] 로그인 여부와 무관하게 `/game` 접근 및 플레이가 가능함 (로그인 상태 확인 코드가 없으므로 자연히 충족)

- [ ] **Step 3: Stop the dev server** (Ctrl+C) once all checks pass.

- [ ] **Step 4: Leave staged** — do not run any git command. Report back to the user what changed and that manual verification passed; they will decide when to `git add`/`commit`/`push`.

---

## Self-Review Notes (for the plan author, already applied above)

- **Spec coverage:** §4 route/scope → Task 4; §5.1–5.3 mechanics → Tasks 1–2; §5.4 no-persistence → confirmed no Supabase code anywhere in this plan; §5.5 copy → `MESSAGES` in Task 1; §6 constraints (no deps, no git commands) → Global Constraints + every task's Step 3; §7 DoD → Task 5.
- **Duplicate ingredient handling:** stage 2's correct sequence contains `빵` twice; `buildBoard` creates one `BoardItem` instance per sequence position (not deduplicated by name), and `handleSelect` matches by `name` against `correctSequence[progress]`, consuming only the clicked instance — so the two visually-identical bread buttons both work correctly regardless of which one is clicked at which point.
- **Type consistency:** `BoardItem`, `Stage`, `STAGES`, `STAGE_TIME_LIMIT_SECONDS`, `MESSAGES`, `buildBoard` are defined once in Task 1 and referenced with the same names/shapes in Tasks 2 and 4.
