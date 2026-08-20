# PR 초안 — 편의점 진열!!! 미니게임

`feature/game-woojoo22kr-a` → `dev` PR 본문에 쓸 초안입니다.

## 개요

편의점 상품을 카테고리별 진열대에 옮기는 드래그앤드롭 퍼즐 게임입니다. 제한시간 60초 안에 상품 12개를 모두 올바른 진열대에 배치하면 성공, 시간이 초과되면 실패합니다.

- **경로:** `/games/shelf-stock`
- **게임 코드:** `src/games/shelf-stock/`
- **라우트:** `src/app/games/shelf-stock/page.tsx` (게임 컴포넌트만 렌더링하는 얇은 래퍼)
- **카테고리 4개:** 음료 / 과자 / 라면류 / 생활용품
- **상품 12개:** 카테고리당 3개

## 게임 흐름

```
물류 박스 개봉 연출(2.2초) → 60초 카운트다운 시작 → 상품 드래그 배치
  → 정답: 초록 피드백 + 진열대로 이동 / 오답: 빨강 피드백 + 트레이 복귀
  → 12개 전부 배치: "진열 완료!" / 시간 초과: "시간 초과!"
  → 다시 도전(무작위 셔플)
```

## 구현 방식

| 항목 | 방식 |
| --- | --- |
| 드래그 | Pointer Events (`pointerdown`/`move`/`up`/`cancel` + `setPointerCapture`) |
| 상태 관리 | 순수 React state, 커스텀 훅 `useShelfGame` 에 집중 |
| 스타일 | CSS Modules (`ShelfGame.module.css`) |
| 상품 아이콘 | 인라인 SVG 12종 (이미지 파일 없음) |
| BGM·효과음 | Web Audio API 오실레이터로 직접 합성 (음원 파일 없음) |

**새로 추가한 npm 패키지 없음.** `package.json`, `globals.css`, `layout.tsx` 등 공용 파일은 수정하지 않았습니다.

HTML5 `dragstart`/`drop` API 대신 Pointer Events를 쓴 이유는 전자가 모바일 터치를 지원하지 않기 때문입니다. 드래그 라이브러리(dnd-kit 등)는 공용 `package.json` 변경이 필요해 사용하지 않았습니다.

## 변경 파일

```
src/app/games/shelf-stock/page.tsx      (신규) 라우트
src/games/shelf-stock/types.ts          (신규) 카테고리·상품 타입
src/games/shelf-stock/data.ts           (신규) 카테고리 4개, 상품 12개 데이터
src/games/shelf-stock/shuffle.ts        (신규) Fisher-Yates 셔플
src/games/shelf-stock/useShelfGame.ts   (신규) 게임 상태·페이즈·타이머
src/games/shelf-stock/ShelfGame.tsx     (신규) 화면 조립·드래그 배선
src/games/shelf-stock/ShelfGame.module.css (신규) 매장 테마 스타일·애니메이션
src/games/shelf-stock/ProductIcon.tsx   (신규) 상품별 SVG 아이콘
src/games/shelf-stock/StoreDecor.tsx    (신규) 화분·물류 박스 SVG
src/games/shelf-stock/audio.ts          (신규) BGM·효과음 합성
CONSPEC.md / plan.md / tasks.md         (신규) 기획·구현 계획 문서
```

## 실행 방법

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev
# http://localhost:3000/games/shelf-stock
```

> `.env.local` 이 없으면 이 게임 페이지를 포함한 **모든 라우트가 500** 으로 실패합니다. `src/proxy.ts` 가 전 경로를 가로채 Supabase 세션을 갱신하는데, 환경변수가 없으면 `createServerClient` 가 예외를 던지기 때문입니다. 인증과 무관한 페이지도 마찬가지입니다.

## 테스트 결과

- [x] `npm run lint` 통과 (경고·오류 없음)
- [x] `npm run build` 통과 (TypeScript 타입체크 포함, `/games/shelf-stock` 라우트 생성 확인)
- [x] 브라우저에서 시작 → 드래그 → 정오답 피드백 → 완료 → 다시하기 흐름 확인
- [x] 최신 `dev` 와 시험 병합 후 빌드·실행 검증 — 충돌 없음, 다른 게임(`brick-breaker`, `wackbbu`)과 동물 허브 모두 정상 동작, `/games/shelf-stock` 이 `/games/[animal]` 동적 라우트에 가로채이지 않음
- [ ] 실제 모바일 기기 터치 조작 (에뮬레이터 외 미확인)
- [ ] 화면 캡처 첨부

## 팀장님 확인 필요

1. **홈 화면 연결** — `src/lib/game/zoo-games.ts` 의 12칸이 모두 동물 테마라 이 게임이 목록에 없습니다. 직접 URL로는 접속되지만 홈에서 연결되지 않습니다. 등록 방식을 정해 주세요. (공용 파일이라 임의로 수정하지 않았습니다)
2. **브랜치 리베이스** — 이 브랜치는 `dev` 에 `CLAUDE.md`, `.claude/` 훅·스킬, 동물 허브가 추가되기 전 시점(`29c6f2c`)에서 분기되어 있습니다. 최신 `dev` 기준으로 리베이스할지 확인 부탁드립니다. (시험 병합 결과 충돌은 없었습니다)
3. **드래그 라이브러리** — 현재 라이브러리 없이 구현했습니다. 팀 차원에서 dnd-kit 등을 도입한다면 맞춰 수정하겠습니다.
