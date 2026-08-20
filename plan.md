# 편의점 상품 진열 게임(shelf-stock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/games/shelf-stock` 경로에서 플레이 가능한, 카테고리 매칭 드래그앤드롭 진열 게임을 만든다 (시작 → 드래그 배치 → 즉시 O/X 피드백 → 완료 메시지 → 다시하기).

**Architecture:** Next.js App Router의 얇은 라우트(`src/app/games/shelf-stock/page.tsx`)가 게임 폴더(`src/games/shelf-stock/`)의 순수 클라이언트 컴포넌트를 렌더링한다. 상태는 커스텀 훅(`useShelfGame`) 하나에 모으고, 드래그는 외부 라이브러리 없이 Pointer Events(pointerdown/move/up)로 마우스와 터치를 동일하게 처리한다.

**Tech Stack:** Next.js(App Router) + TypeScript + React state(순수, 상태관리 라이브러리 없음) + CSS Modules(게임 폴더 내부 전용, 전역 CSS 미변경). 새 npm 의존성 없음.

**Spec:** [CONSPEC.md](./CONSPEC.md)

## Global Constraints

- 담당 게임 폴더(`src/games/shelf-stock/`)와 이 게임 전용 라우트(`src/app/games/shelf-stock/`) 외의 파일은 수정하지 않는다. 공용 파일(`package.json`, `globals.css`, `layout.tsx` 등)은 절대 건드리지 않는다 — CONSPEC 5절.
- 새 npm 패키지를 추가하지 않는다 (드래그앤드롭 라이브러리 팀장 승인 대기 중 — CONSPEC 5절 미확정 항목). 승인이 나면 Task 3~4의 Pointer Events 로직을 라이브러리 기반으로 교체할 수 있으나, 이 계획은 승인 없이도 완주 가능한 경로를 택한다.
- 테스트 프레임워크가 이 저장소에 설치되어 있지 않고, 새로 설치하면 공용 `package.json`을 건드리게 되어 위 제약과 충돌한다. 따라서 이 계획은 자동화된 유닛 테스트 대신, **각 태스크 종료 시 브라우저에서 직접 확인하는 시각적 검증**을 "테스트"로 사용한다 (사용자 요청: "끝나면 눈으로 확인 가능하게").
- 카테고리는 정확히 4개(음료/과자/라면류/생활용품), 상품은 정확히 12개(카테고리당 3개), 단일 스테이지, 점수 없이 "완료" 메시지만 표시, 점수/기록은 세션 내에서만 유지(영구 저장 없음) — CONSPEC 3~4절.
- 실패 상태 없음: 잘못 놓으면 즉시 시각 피드백 후 트레이로 되돌아갈 뿐, 페널티나 게임오버는 없음 — CONSPEC 3절.
- "다시하기"는 항상 상품 배치를 무작위로 셔플한다 — CONSPEC 3절.
- Definition of Done(팀 공통, CONSPEC 6절): 접속 가능, 시작→플레이→완료→다시하기 흐름 동작, 모바일 터치 조작 가능, 콘솔 치명적 오류 없음, `npm run lint` / `npm run build` 통과.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/games/shelf-stock/types.ts` | `CategoryId`, `Category`, `Product` 타입 정의 |
| `src/games/shelf-stock/data.ts` | 카테고리 4개 + 상품 12개의 고정 데이터 |
| `src/games/shelf-stock/shuffle.ts` | Fisher-Yates 셔플 순수 함수 |
| `src/games/shelf-stock/useShelfGame.ts` | 게임 상태(트레이, 배치, 피드백, 완료 여부)와 액션(`attemptPlace`, `restart`) |
| `src/games/shelf-stock/ProductIcon.tsx` | 상품 하나를 간단한 벡터(SVG) 아이콘 + 라벨로 렌더링 |
| `src/games/shelf-stock/ShelfGame.tsx` | 화면 전체 조립: 카테고리 칸, 트레이, 드래그 처리, 완료 배너, 다시하기 버튼 |
| `src/games/shelf-stock/ShelfGame.module.css` | 이 게임 전용 스타일(반응형 포함) |
| `src/app/games/shelf-stock/page.tsx` | `/games/shelf-stock` 라우트, `ShelfGame` 렌더링만 담당하는 얇은 래퍼 |

이 구조는 팀 컨벤션(`src/games/<slug>/`)을 처음으로 실제 코드에 적용하는 사례다. 라우트를 `src/app/games/<slug>/page.tsx`로 연결하는 방식은 Next.js App Router의 표준 패턴을 따른 것이며, 다른 팀원/팀장이 다른 방식을 이미 정해뒀다면 Task 1에서 경로만 조정하면 된다.

---

### Task 1: 라우트 + 데이터 모델 + 정적 화면

**Files:**
- Create: `src/games/shelf-stock/types.ts`
- Create: `src/games/shelf-stock/data.ts`
- Create: `src/games/shelf-stock/ShelfGame.tsx`
- Create: `src/games/shelf-stock/ShelfGame.module.css`
- Create: `src/app/games/shelf-stock/page.tsx`

**Interfaces:**
- Produces: `CategoryId` (`"beverage" | "snack" | "noodle" | "daily"`), `Category { id: CategoryId; label: string }`, `Product { id: string; name: string; categoryId: CategoryId }`, `CATEGORIES: Category[]`, `PRODUCTS: Product[]`, `ShelfGame` 컴포넌트(prop 없음)

- [ ] **Step 1: 타입 정의**

`src/games/shelf-stock/types.ts`:
```ts
export type CategoryId = "beverage" | "snack" | "noodle" | "daily";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: CategoryId;
}
```

- [ ] **Step 2: 고정 데이터 작성**

`src/games/shelf-stock/data.ts`:
```ts
import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = [
  { id: "beverage", label: "음료" },
  { id: "snack", label: "과자" },
  { id: "noodle", label: "라면류" },
  { id: "daily", label: "생활용품" },
];

export const PRODUCTS: Product[] = [
  { id: "cola", name: "콜라", categoryId: "beverage" },
  { id: "juice", name: "주스", categoryId: "beverage" },
  { id: "water", name: "생수", categoryId: "beverage" },
  { id: "chips", name: "감자칩", categoryId: "snack" },
  { id: "chocolate", name: "초콜릿", categoryId: "snack" },
  { id: "cookie", name: "쿠키", categoryId: "snack" },
  { id: "ramen", name: "라면", categoryId: "noodle" },
  { id: "udon", name: "우동", categoryId: "noodle" },
  { id: "jjajang", name: "짜장라면", categoryId: "noodle" },
  { id: "tissue", name: "휴지", categoryId: "daily" },
  { id: "toothbrush", name: "칫솔", categoryId: "daily" },
  { id: "battery", name: "건전지", categoryId: "daily" },
];
```

- [ ] **Step 3: 정적 화면 컴포넌트 작성 (드래그 없음)**

`src/games/shelf-stock/ShelfGame.tsx`:
```tsx
"use client";

import { CATEGORIES, PRODUCTS } from "./data";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>편의점 상품 진열</h1>

      <section className={styles.categories}>
        {CATEGORIES.map((category) => (
          <div key={category.id} className={styles.categoryBox}>
            <h2 className={styles.categoryLabel}>{category.label}</h2>
          </div>
        ))}
      </section>

      <section className={styles.tray}>
        {PRODUCTS.map((product) => (
          <div key={product.id} className={styles.productChip}>
            {product.name}
          </div>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 최소 스타일 작성**

`src/games/shelf-stock/ShelfGame.module.css`:
```css
.page {
  min-height: 100dvh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 1.5rem;
  text-align: center;
}

.categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.categoryBox {
  border: 2px dashed #999;
  border-radius: 12px;
  min-height: 96px;
  padding: 8px;
}

.categoryLabel {
  font-size: 1rem;
  text-align: center;
  margin: 0;
}

.tray {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.productChip {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fff;
}
```

- [ ] **Step 5: 라우트 파일 작성**

`src/app/games/shelf-stock/page.tsx`:
```tsx
import { ShelfGame } from "@/games/shelf-stock/ShelfGame";

export default function ShelfStockPage() {
  return <ShelfGame />;
}
```

- [ ] **Step 6: 눈으로 확인**

```bash
npm run dev
```
브라우저에서 `http://localhost:3000/games/shelf-stock` 접속.
확인할 것: "편의점 상품 진열" 제목, 점선 테두리 칸 4개(음료/과자/라면류/생활용품 라벨), 그 아래 상품 이름 12개(콜라~건전지)가 텍스트 칩으로 보임. 드래그는 아직 안 됨 — 정상.

- [ ] **Step 7: 커밋**

```bash
git add src/games/shelf-stock src/app/games/shelf-stock
git commit -m "feat(shelf-stock): 정적 라우트와 데이터 모델 추가"
```

---

### Task 2: 벡터 아이콘 적용

**Files:**
- Create: `src/games/shelf-stock/ProductIcon.tsx`
- Modify: `src/games/shelf-stock/ShelfGame.tsx` (트레이 렌더링 부분)
- Modify: `src/games/shelf-stock/ShelfGame.module.css` (아이콘 관련 스타일 추가)

**Interfaces:**
- Consumes: `Product` (Task 1의 `types.ts`)
- Produces: `ProductIcon({ product: Product }): JSX.Element`

카테고리별로 모양(도형)을, 색은 카테고리별 고정 팔레트를 사용해 사진 없이도 상품을 구분할 수 있게 한다.

- [ ] **Step 1: 카테고리별 색상 매핑과 아이콘 컴포넌트 작성**

`src/games/shelf-stock/ProductIcon.tsx`:
```tsx
import type { CategoryId, Product } from "./types";

const CATEGORY_COLOR: Record<CategoryId, string> = {
  beverage: "#4098d7",
  snack: "#e0a03c",
  noodle: "#d9534f",
  daily: "#5cb85c",
};

function CategoryGlyph({ categoryId }: { categoryId: CategoryId }) {
  const color = CATEGORY_COLOR[categoryId];
  switch (categoryId) {
    case "beverage":
      return <circle cx="20" cy="20" r="14" fill={color} />;
    case "snack":
      return <polygon points="20,6 34,34 6,34" fill={color} />;
    case "noodle":
      return <rect x="6" y="6" width="28" height="28" rx="6" fill={color} />;
    case "daily":
      return (
        <polygon
          points="20,4 24,16 37,16 26,24 30,36 20,28 10,36 14,24 3,16 16,16"
          fill={color}
        />
      );
  }
}

export function ProductIcon({ product }: { product: Product }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <CategoryGlyph categoryId={product.categoryId} />
    </svg>
  );
}
```

- [ ] **Step 2: 트레이에서 텍스트 대신 아이콘 + 라벨 사용**

`src/games/shelf-stock/ShelfGame.tsx`의 트레이 섹션 교체:
```tsx
      <section className={styles.tray}>
        {PRODUCTS.map((product) => (
          <div key={product.id} className={styles.productChip}>
            <ProductIcon product={product} />
            <span className={styles.productName}>{product.name}</span>
          </div>
        ))}
      </section>
```
파일 상단 import에 `import { ProductIcon } from "./ProductIcon";` 추가.

- [ ] **Step 3: 칩 레이아웃 스타일 보강**

`ShelfGame.module.css`에 추가:
```css
.productChip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.productName {
  font-size: 0.75rem;
}
```
(기존 `.productChip` 규칙 중 레이아웃 관련 부분과 합쳐서 중복 없게 정리)

- [ ] **Step 4: 눈으로 확인**

`npm run dev` 상태에서 `/games/shelf-stock` 새로고침. 상품 12개 각각에 도형 아이콘(음료=원, 과자=삼각형, 라면류=사각형, 생활용품=별)이 색깔별로 보이고, 그 아래 상품 이름이 표시되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "feat(shelf-stock): 상품 벡터 아이콘 추가"
```

---

### Task 3: 커스텀 드래그 (Pointer Events, 드롭 판정 없이 따라다니기만)

**Files:**
- Create: `src/games/shelf-stock/useShelfGame.ts`
- Modify: `src/games/shelf-stock/ShelfGame.tsx`
- Modify: `src/games/shelf-stock/ShelfGame.module.css`

**Interfaces:**
- Consumes: `PRODUCTS` (`data.ts`)
- Produces: `useShelfGame(): { trayProducts: Product[]; dragging: { productId: string; x: number; y: number } | null; startDrag(e, productId): void; }` — 이후 태스크에서 이 훅에 필드를 추가한다.

네이티브 HTML5 `dragstart`/`drop` API는 모바일 터치를 지원하지 않으므로 사용하지 않는다. 대신 Pointer Events(`pointerdown`/`pointermove`/`pointerup`)와 `setPointerCapture`를 사용해 마우스와 터치를 동일한 코드로 처리한다.

- [ ] **Step 1: 상태 훅 뼈대 작성 (드래그 좌표만 추적)**

`src/games/shelf-stock/useShelfGame.ts`:
```ts
"use client";

import { useState } from "react";
import { PRODUCTS } from "./data";

interface DragState {
  productId: string;
  x: number;
  y: number;
}

export function useShelfGame() {
  const [trayIds] = useState<string[]>(() => PRODUCTS.map((p) => p.id));
  const [dragging, setDragging] = useState<DragState | null>(null);

  const trayProducts = trayIds.map(
    (id) => PRODUCTS.find((p) => p.id === id)!
  );

  function startDrag(productId: string, x: number, y: number) {
    setDragging({ productId, x, y });
  }

  function moveDrag(x: number, y: number) {
    setDragging((prev) => (prev ? { ...prev, x, y } : prev));
  }

  function endDrag() {
    setDragging(null);
  }

  return { trayProducts, dragging, startDrag, moveDrag, endDrag };
}
```

- [ ] **Step 2: `ShelfGame`에서 훅을 사용해 포인터 이벤트 연결**

`ShelfGame.tsx`를 다음과 같이 갱신 (전체 파일 교체):
```tsx
"use client";

import { CATEGORIES } from "./data";
import { ProductIcon } from "./ProductIcon";
import { useShelfGame } from "./useShelfGame";
import styles from "./ShelfGame.module.css";

export function ShelfGame() {
  const { trayProducts, dragging, startDrag, moveDrag, endDrag } =
    useShelfGame();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>편의점 상품 진열</h1>

      <section className={styles.categories}>
        {CATEGORIES.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            className={styles.categoryBox}
          >
            <h2 className={styles.categoryLabel}>{category.label}</h2>
          </div>
        ))}
      </section>

      <section className={styles.tray}>
        {trayProducts.map((product) => {
          const isDragging = dragging?.productId === product.id;
          return (
            <div
              key={product.id}
              className={`${styles.productChip} ${isDragging ? styles.dragging : ""}`}
              style={
                isDragging
                  ? { left: dragging.x, top: dragging.y }
                  : undefined
              }
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startDrag(product.id, e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (dragging?.productId === product.id) {
                  moveDrag(e.clientX, e.clientY);
                }
              }}
              onPointerUp={() => {
                endDrag();
              }}
            >
              <ProductIcon product={product} />
              <span className={styles.productName}>{product.name}</span>
            </div>
          );
        })}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 드래그 중 스타일 추가**

`ShelfGame.module.css`에 추가:
```css
.productChip {
  touch-action: none;
  cursor: grab;
}

.dragging {
  position: fixed;
  z-index: 10;
  transform: translate(-50%, -50%);
  pointer-events: none;
  cursor: grabbing;
}
```

- [ ] **Step 4: 눈으로 확인**

`npm run dev` 상태에서 상품 칩을 마우스로 눌러서 화면 위를 움직여본다. 칩이 커서를 따라 움직이고, 마우스를 떼면 원래 트레이 자리로 돌아가는지 확인 (아직 카테고리 칸에 놓아도 아무 반응 없음 — 다음 태스크에서 추가).

- [ ] **Step 5: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "feat(shelf-stock): Pointer Events 기반 커스텀 드래그 추가"
```

---

### Task 4: 드롭 판정 (카테고리 매칭) + 즉시 피드백

**Files:**
- Modify: `src/games/shelf-stock/useShelfGame.ts` (전체 교체)
- Modify: `src/games/shelf-stock/ShelfGame.tsx` (onPointerUp 로직, 카테고리 칸 렌더링)
- Modify: `src/games/shelf-stock/ShelfGame.module.css`

**Interfaces:**
- Consumes: `CategoryId`, `Product`, `CATEGORIES`, `PRODUCTS`
- Produces: `useShelfGame(): { categories: Category[]; trayProducts: Product[]; placedByCategory: Record<CategoryId, Product[]>; dragging; startDrag; moveDrag; attemptPlace(productId: string, categoryId: CategoryId | null): void; feedback: { productId: string; correct: boolean } | null }`

- [ ] **Step 1: 배치/피드백 상태 추가 (전체 파일 교체)**

`src/games/shelf-stock/useShelfGame.ts`:
```ts
"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS } from "./data";
import type { CategoryId, Product } from "./types";

interface DragState {
  productId: string;
  x: number;
  y: number;
}

interface Feedback {
  productId: string;
  correct: boolean;
}

export function useShelfGame() {
  const [trayIds, setTrayIds] = useState<string[]>(() =>
    PRODUCTS.map((p) => p.id)
  );
  const [placed, setPlaced] = useState<Record<string, CategoryId>>({});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

  const trayProducts: Product[] = trayIds.map((id) => productById.get(id)!);

  const placedByCategory: Record<CategoryId, Product[]> = {
    beverage: [],
    snack: [],
    noodle: [],
    daily: [],
  };
  for (const [productId, categoryId] of Object.entries(placed)) {
    placedByCategory[categoryId].push(productById.get(productId)!);
  }

  function startDrag(productId: string, x: number, y: number) {
    setDragging({ productId, x, y });
  }

  function moveDrag(x: number, y: number) {
    setDragging((prev) => (prev ? { ...prev, x, y } : prev));
  }

  function attemptPlace(productId: string, categoryId: CategoryId | null) {
    setDragging(null);
    if (!categoryId) return;

    const product = productById.get(productId);
    if (!product) return;

    const correct = product.categoryId === categoryId;
    setFeedback({ productId, correct });
    window.setTimeout(() => setFeedback(null), 400);

    if (correct) {
      setTrayIds((prev) => prev.filter((id) => id !== productId));
      setPlaced((prev) => ({ ...prev, [productId]: categoryId }));
    }
  }

  return {
    categories: CATEGORIES,
    trayProducts,
    placedByCategory,
    dragging,
    startDrag,
    moveDrag,
    attemptPlace,
    feedback,
  };
}
```

- [ ] **Step 2: `onPointerUp`에서 놓인 위치의 카테고리를 찾아 `attemptPlace` 호출**

`ShelfGame.tsx`에서 트레이 아이템의 `onPointerUp`을 교체:
```tsx
              onPointerUp={(e) => {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                const categoryEl = el?.closest<HTMLElement>(
                  "[data-category-id]"
                );
                const categoryId = categoryEl?.dataset
                  .categoryId as CategoryId | undefined;
                attemptPlace(product.id, categoryId ?? null);
              }}
```
파일 상단 import에 `import type { CategoryId } from "./types";` 추가하고, `useShelfGame()` 구조분해에서 `endDrag` 대신 `attemptPlace`를 받아온다. `categories` 배열도 훅에서 받아 `CATEGORIES` 직접 import는 제거한다.

- [ ] **Step 3: 카테고리 칸에 배치된 상품과 피드백 색상 표시**

`ShelfGame.tsx`의 카테고리 렌더링을 교체:
```tsx
      <section className={styles.categories}>
        {categories.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            className={styles.categoryBox}
          >
            <h2 className={styles.categoryLabel}>{category.label}</h2>
            <div className={styles.placedRow}>
              {placedByCategory[category.id].map((product) => (
                <ProductIcon key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </section>
```
트레이 칩에는 피드백 클래스를 추가:
```tsx
              className={`${styles.productChip} ${
                isDragging ? styles.dragging : ""
              } ${
                feedback?.productId === product.id
                  ? feedback.correct
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong
                  : ""
              }`}
```

- [ ] **Step 4: 피드백 스타일 추가**

`ShelfGame.module.css`에 추가:
```css
.placedRow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.feedbackCorrect {
  outline: 3px solid #2e9e44;
}

.feedbackWrong {
  outline: 3px solid #d9534f;
}
```

- [ ] **Step 5: 눈으로 확인**

`npm run dev` 상태에서:
1. 맞는 카테고리 칸(예: 콜라를 "음료" 칸)에 드래그해서 놓으면 초록 테두리가 잠깐 보이고, 트레이에서 사라지고 카테고리 칸 안에 아이콘이 나타나는지 확인.
2. 틀린 칸(예: 콜라를 "과자" 칸)에 놓으면 빨간 테두리가 잠깐 보이고, 트레이 자리로 되돌아가는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "feat(shelf-stock): 카테고리 매칭 판정과 즉시 피드백 추가"
```

---

### Task 5: 완료 감지 + 완료 메시지

**Files:**
- Modify: `src/games/shelf-stock/useShelfGame.ts` (`isComplete` 필드 추가)
- Modify: `src/games/shelf-stock/ShelfGame.tsx` (완료 배너 렌더링)
- Modify: `src/games/shelf-stock/ShelfGame.module.css`

**Interfaces:**
- Produces: `useShelfGame()`에 `isComplete: boolean` 필드 추가 (트레이가 비면 `true`)

- [ ] **Step 1: `isComplete` 계산 추가**

`useShelfGame.ts`의 반환문 바로 위에 추가:
```ts
  const isComplete = trayProducts.length === 0;
```
반환 객체에 `isComplete`를 포함시킨다: `return { categories: CATEGORIES, trayProducts, placedByCategory, dragging, startDrag, moveDrag, attemptPlace, feedback, isComplete };`

- [ ] **Step 2: 완료 배너 렌더링**

`ShelfGame.tsx`에서 `useShelfGame()` 구조분해에 `isComplete` 추가하고, `<h1>` 아래에 삽입:
```tsx
      {isComplete && (
        <p className={styles.completeBanner}>완료!</p>
      )}
```

- [ ] **Step 3: 배너 스타일 추가**

`ShelfGame.module.css`에 추가:
```css
.completeBanner {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2e9e44;
}
```

- [ ] **Step 4: 눈으로 확인**

`npm run dev` 상태에서 상품 12개를 모두 올바른 칸에 배치한다. 마지막 상품을 올바르게 놓는 순간 "완료!" 문구가 화면에 나타나는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "feat(shelf-stock): 완료 감지와 완료 메시지 추가"
```

---

### Task 6: 다시하기 버튼 (무작위 셔플)

**Files:**
- Create: `src/games/shelf-stock/shuffle.ts`
- Modify: `src/games/shelf-stock/useShelfGame.ts` (`restart` 액션 추가, 트레이 초기값을 셔플로 변경)
- Modify: `src/games/shelf-stock/ShelfGame.tsx` (다시하기 버튼)
- Modify: `src/games/shelf-stock/ShelfGame.module.css`

**Interfaces:**
- Produces: `shuffle<T>(items: T[]): T[]`, `useShelfGame()`에 `restart(): void` 추가

- [ ] **Step 1: 셔플 유틸 작성**

`src/games/shelf-stock/shuffle.ts`:
```ts
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 2: 훅에 셔플 적용 + `restart` 추가**

`useShelfGame.ts`에서:
- import 추가: `import { shuffle } from "./shuffle";`
- 트레이 초기값 변경: `useState<string[]>(() => shuffle(PRODUCTS.map((p) => p.id)))`
- 반환문 위에 함수 추가:
```ts
  function restart() {
    setTrayIds(shuffle(PRODUCTS.map((p) => p.id)));
    setPlaced({});
    setDragging(null);
    setFeedback(null);
  }
```
- 반환 객체에 `restart` 추가.

- [ ] **Step 3: 다시하기 버튼 렌더링**

`ShelfGame.tsx`의 `useShelfGame()` 구조분해에 `restart` 추가하고, 완료 배너 아래에 버튼 삽입:
```tsx
      <button
        type="button"
        className={styles.restartButton}
        onClick={restart}
      >
        다시하기
      </button>
```
(버튼은 완료 여부와 무관하게 항상 보이도록 배치 — 플레이 중에도 다시 시작 가능해야 함)

- [ ] **Step 4: 버튼 스타일 추가**

`ShelfGame.module.css`에 추가:
```css
.restartButton {
  align-self: center;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 1rem;
}
```

- [ ] **Step 5: 눈으로 확인**

`npm run dev` 상태에서 "다시하기"를 여러 번 눌러본다. 매번 트레이의 상품 배치 순서가 달라지고, 카테고리 칸에 넣어뒀던 상품들이 다시 트레이로 돌아오는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "feat(shelf-stock): 다시하기(무작위 셔플) 추가"
```

---

### Task 7: 모바일 반응형 + 터치 동작 확인

**Files:**
- Modify: `src/games/shelf-stock/ShelfGame.module.css`

**Interfaces:** 없음 (스타일 전용 태스크)

- [ ] **Step 1: 좁은 화면 대응 스타일 추가**

`ShelfGame.module.css` 끝에 추가:
```css
@media (max-width: 480px) {
  .categories {
    grid-template-columns: 1fr;
  }

  .productChip {
    padding: 6px 8px;
  }

  .productName {
    font-size: 0.7rem;
  }
}
```

- [ ] **Step 2: 크롬 개발자도구로 모바일 뷰 확인**

`npm run dev` 상태에서 브라우저 개발자도구를 열고 기기 툴바(모바일 에뮬레이션)를 켠 뒤 `/games/shelf-stock`을 확인한다.
확인할 것:
1. 카테고리 칸 4개가 세로로 한 줄씩 쌓여 겹치지 않는다.
2. 개발자도구의 터치 시뮬레이션(또는 실제 모바일 기기/터치스크린 노트북)으로 상품 칩을 눌러 끌었을 때, 페이지 자체가 스크롤되지 않고 칩만 따라 움직인다 (Task 3에서 추가한 `touch-action: none` 덕분).
3. 터치로 카테고리 칸 위에서 손을 떼면 Task 4와 동일하게 O/X 피드백이 나타난다.

- [ ] **Step 3: 커밋**

```bash
git add src/games/shelf-stock
git commit -m "style(shelf-stock): 모바일 반응형 레이아웃 보강"
```

---

### Task 8: lint/build 검증 + PR 준비

**Files:** 없음 (검증 전용 태스크)

- [ ] **Step 1: lint 실행**

```bash
npm run lint
```
`src/games/shelf-stock`, `src/app/games/shelf-stock` 관련 오류/경고가 없는지 확인. 오류가 있으면 해당 파일만 수정 후 재실행.

- [ ] **Step 2: build 실행**

```bash
npm run build
```
빌드가 오류 없이 끝까지 성공하는지 확인.

- [ ] **Step 3: 콘솔 오류 확인**

`npm run dev` 상태에서 `/games/shelf-stock`을 열고 브라우저 개발자도구 콘솔을 확인한다. 게임 플레이(드래그, 완료, 다시하기)를 한 번 끝까지 수행하면서 빨간 에러 로그가 없는지 확인.

- [ ] **Step 4: PR 설명 초안 작성**

CONSPEC.md 6절 Definition of Done 체크리스트를 그대로 PR 본문에 붙여넣고, 각 항목 옆에 실행 결과(스크린샷, `npm run lint`/`npm run build` 출력)를 첨부할 자리를 표시해둔다. 실제 PR 생성은 팀장과 브랜치 최신화 여부([확인 필요], CONSPEC 5절)를 확인한 뒤 진행한다.

- [ ] **Step 5: 커밋 (문서만 변경했을 경우)**

```bash
git add plan.md tasks.md
git commit -m "docs(shelf-stock): 구현 계획/체크리스트 정리"
```

---

## Self-Review 메모

- **Spec coverage**: CONSPEC 3절(핵심 메커닉) → Task 3~5, 4절(범위/자산) → Task 1~2, 5절(제약) → Global Constraints + Task 3(라이브러리 미사용)/Task 8(lint/build), 6절(성공 기준) → Task 7~8. CONSPEC의 `[확인 필요]` 4가지(라이브러리 승인, 브랜치 최신화, 폴더-라우트 연결, 공통 레이어 대기)는 이 계획에서 임의로 확정하지 않고 Global Constraints와 Task 8에 "팀장 확인 필요"로 명시했다.
- **Placeholder scan**: 모든 스텝에 실행 가능한 실제 코드/명령어를 넣었다. "적절히 처리" 같은 모호한 표현 없음.
- **Type consistency**: `CategoryId`/`Category`/`Product`(Task1) → `useShelfGame` 반환 타입(Task3~6)까지 필드명(`trayProducts`, `placedByCategory`, `dragging`, `attemptPlace`, `feedback`, `isComplete`, `restart`)이 태스크 전체에서 동일하게 유지되도록 각 훅 버전을 전체 교체 코드로 제공했다.
