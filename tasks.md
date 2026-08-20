# tasks.md — 편의점 상품 진열 게임(shelf-stock) 체크리스트

전체 구현 계획: [plan.md](./plan.md) / 요구사항: [CONSPEC.md](./CONSPEC.md)

각 항목은 2~5분 안에 끝나는 단일 작업입니다. 위에서부터 순서대로 진행하세요.

## Task 1 — 라우트 + 데이터 모델 + 정적 화면

- [ ] `src/games/shelf-stock/types.ts` 생성 — `CategoryId`/`Category`/`Product` 타입 작성
- [ ] `src/games/shelf-stock/data.ts` 생성 — `CATEGORIES` 4개, `PRODUCTS` 12개 작성
- [ ] `src/games/shelf-stock/ShelfGame.tsx` 생성 — 카테고리 4칸 + 상품 12개 텍스트 칩을 정적으로 렌더링
- [ ] `src/games/shelf-stock/ShelfGame.module.css` 생성 — 기본 레이아웃 스타일
- [ ] `src/app/games/shelf-stock/page.tsx` 생성 — `ShelfGame` 렌더링
- [ ] `npm run dev` 실행 후 `/games/shelf-stock`에서 제목·카테고리 4칸·상품 12개 텍스트 확인
- [ ] 커밋: `feat(shelf-stock): 정적 라우트와 데이터 모델 추가`

## Task 2 — 벡터 아이콘 적용

- [ ] `src/games/shelf-stock/ProductIcon.tsx` 생성 — 카테고리별 색상/도형 SVG 아이콘
- [ ] `ShelfGame.tsx` 트레이 렌더링을 텍스트 → `ProductIcon` + 라벨로 교체
- [ ] `ShelfGame.module.css`에 아이콘/칩 레이아웃 스타일 추가
- [ ] 화면에서 음료=원/과자=삼각형/라면류=사각형/생활용품=별 아이콘이 색깔별로 보이는지 확인
- [ ] 커밋: `feat(shelf-stock): 상품 벡터 아이콘 추가`

## Task 3 — 커스텀 드래그 (Pointer Events)

- [ ] `src/games/shelf-stock/useShelfGame.ts` 생성 — `trayProducts`/`dragging`/`startDrag`/`moveDrag`/`endDrag`
- [ ] `ShelfGame.tsx`에 `onPointerDown`/`onPointerMove`/`onPointerUp` 연결 (setPointerCapture 사용)
- [ ] `ShelfGame.module.css`에 `.dragging`(position:fixed 등), `touch-action:none` 추가
- [ ] 마우스로 상품 칩을 눌러 끌면 커서를 따라 움직이고, 떼면 트레이로 복귀하는지 확인
- [ ] 커밋: `feat(shelf-stock): Pointer Events 기반 커스텀 드래그 추가`

## Task 4 — 드롭 판정(카테고리 매칭) + 즉시 피드백

- [ ] `useShelfGame.ts`에 `placed`/`placedByCategory`/`feedback`/`attemptPlace` 추가 (전체 교체)
- [ ] `ShelfGame.tsx`의 `onPointerUp`에서 `document.elementFromPoint` + `closest("[data-category-id]")`로 놓인 칸 판정
- [ ] 카테고리 칸에 `data-category-id` 속성 추가, 칸 안에 배치된 상품 아이콘 렌더링(`placedRow`)
- [ ] `ShelfGame.module.css`에 `.feedbackCorrect`(초록 테두리) / `.feedbackWrong`(빨강 테두리) 추가
- [ ] 맞는 칸에 놓으면 초록 피드백 + 트레이에서 사라짐, 틀린 칸에 놓으면 빨강 피드백 + 트레이 복귀 확인
- [ ] 커밋: `feat(shelf-stock): 카테고리 매칭 판정과 즉시 피드백 추가`

## Task 5 — 완료 감지 + 완료 메시지

- [ ] `useShelfGame.ts`에 `isComplete = trayProducts.length === 0` 추가
- [ ] `ShelfGame.tsx`에 완료 배너(`"완료!"`) 조건부 렌더링 추가
- [ ] `ShelfGame.module.css`에 `.completeBanner` 스타일 추가
- [ ] 상품 12개를 모두 올바르게 배치하면 "완료!" 문구가 뜨는지 확인
- [ ] 커밋: `feat(shelf-stock): 완료 감지와 완료 메시지 추가`

## Task 6 — 다시하기(무작위 셔플)

- [ ] `src/games/shelf-stock/shuffle.ts` 생성 — Fisher-Yates `shuffle<T>`
- [ ] `useShelfGame.ts`: 트레이 초기값을 `shuffle(...)`로 변경, `restart()` 함수 추가
- [ ] `ShelfGame.tsx`에 "다시하기" 버튼 추가 (완료 여부와 무관하게 항상 표시)
- [ ] `ShelfGame.module.css`에 `.restartButton` 스타일 추가
- [ ] "다시하기"를 여러 번 눌러 매번 배치 순서가 달라지고 배치했던 상품이 리셋되는지 확인
- [ ] 커밋: `feat(shelf-stock): 다시하기(무작위 셔플) 추가`

## Task 7 — 모바일 반응형 + 터치 확인

- [ ] `ShelfGame.module.css`에 `@media (max-width: 480px)` 규칙 추가 (카테고리 1열, 칩 크기 축소)
- [ ] 개발자도구 모바일 에뮬레이션에서 카테고리 4칸이 겹치지 않고 세로로 쌓이는지 확인
- [ ] 터치(또는 터치 에뮬레이션)로 드래그 시 페이지 스크롤 없이 칩만 움직이는지 확인
- [ ] 터치로 카테고리 칸에 놓았을 때 O/X 피드백이 마우스와 동일하게 동작하는지 확인
- [ ] 커밋: `style(shelf-stock): 모바일 반응형 레이아웃 보강`

## Task 8 — lint/build 검증 + PR 준비

- [ ] `npm run lint` 실행, 오류/경고 없는지 확인 (있으면 수정 후 재실행)
- [ ] `npm run build` 실행, 끝까지 성공하는지 확인
- [ ] 플레이 한 판(드래그→완료→다시하기)을 끝까지 수행하며 브라우저 콘솔에 에러 없는지 확인
- [ ] CONSPEC.md 6절 Definition of Done 체크리스트를 PR 본문 초안에 복사
- [ ] 커밋: `docs(shelf-stock): 구현 계획/체크리스트 정리` (plan.md/tasks.md 변경 시)

## 이번 계획 밖의 [확인 필요] 항목 (팀장 확인 후 착수)

- [ ] 드래그앤드롭 라이브러리 추가 승인 여부 (현재는 라이브러리 없이 진행 중)
- [ ] `feature/game-woojoo22kr-a` 브랜치를 최신 `origin/dev` 기준으로 리베이스/재시작해야 하는지
- [ ] `src/games/<slug>/` ↔ `src/app/games/<slug>/` 라우트 연결 방식이 팀 컨벤션과 일치하는지
- [ ] `feature/game-common` 공통 레이어를 기다릴지, 이대로 독자 진행할지
- [ ] 게임 표시 이름(화면에 보일 제목/PR 제목용 한글 이름) — slug는 `shelf-stock`으로 확정, 표시용 이름은 아직 미정
