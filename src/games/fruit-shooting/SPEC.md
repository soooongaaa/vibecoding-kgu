# 클레이 사격 (clay-shooting)

담당: joyuni (feature/game-joyuni-a) · 12개 미니게임 중 하나

## 개요

마우스로 조준·클릭해서 하늘로 날아오르는 클레이(점토 원반)를 맞추는 아케이드 사격 게임.
`src/games/brick-breaker/`와 동일한 패턴(단일 클라이언트 컴포넌트 + CSS 모듈, 자체 상태만 사용,
백엔드/DB 없음)을 따른다. 통과 여부만 화면에 표시하고, 점수 저장·랭킹은 이 게임의 범위가 아니다
(공통 스캐폴드가 준비되면 그때 연동).

## 화면 진입

- 라우트: `/games/clay-shooting`
- 진입 파일: `src/app/games/clay-shooting/page.tsx` (brick-breaker와 동일하게 `<ClayShooting />`만 렌더링하는 얇은 래퍼)
- 로그인 여부 체크는 하지 않는다 (brick-breaker도 하지 않음 — 로그인·인증은 다른 팀원 담당 영역).

## 게임 규칙

- 캔버스 900×600 (CSS로 반응형 스케일, `aspect-ratio`로 브릭브레이커와 동일 처리).
- 제한시간 60초. 시작하면 타이머가 줄어든다.
- 약 3초 간격으로 클레이 2개가 화면 하단 좌/우에서 동시에 발사되어 포물선(중력) 궤적으로 날아간다.
- 클릭한 지점과 겹치는(원형 히트박스) 활성 클레이가 있으면 명중: 파편 효과 후 제거, 명중 수 +1.
- 화면 밖으로 나간 클레이는 자동 소멸(미스, 감점 없음).
- 60초 동안 총 약 40개(3초 간격 × 2개)가 등장하는 기준.
- **명중 수 ≥ 20 → 통과(Clear)**, 미만 → **실패(Fail)**.
- 화면에는 남은 시간과 현재 명중 수를 실시간 표시.
- 종료 시 결과 오버레이: 통과/실패 여부 + 최종 명중 수 + "다시 하기" 버튼.

## 상태 머신 (brick-breaker의 `Phase` 패턴 재사용)

```
"ready" -> "playing" -> "cleared" | "failed" -> (다시 하기) -> "playing"
```

## 파일 구성

```
src/games/clay-shooting/
├── SPEC.md                        # 이 문서
├── ClayShooting.tsx                # "use client" 게임 본체 (state machine, RAF 루프, 입력 처리)
├── ClayShooting.module.css         # brick-breaker와 톤 맞춤(#0f172a 배경 등)
└── engine.ts                       # 순수 함수: 타겟 스폰, 포물선 위치 계산, 원형 히트 테스트
src/app/games/clay-shooting/
└── page.tsx                        # 얇은 라우트 래퍼
```

`engine.ts`를 분리하는 이유: 물리·히트테스트 로직은 canvas/React 상태와 무관한 순수 함수라
따로 두면 읽기 쉽고, 필요하면 이후 다른 게임에서도 참고하기 쉽다. brick-breaker는 로직이 컴포넌트
안에 다 있지만, 이 게임은 스폰 타이밍·포물선 계산이 더 복잡해서 분리한다.

## 범위 밖 (Out of scope)

- Supabase 테이블/API 라우트 — 만들지 않는다. 공통 점수/결과 전달 방식은 `feature/game-common`이
  생기면 그때 `onGameEnd` 같은 콜백으로 연결한다(지금은 자리만 남겨두는 정도로 최소화).
- 로그인 체크, 전역 네비게이션/허브 화면 연동 — 다른 팀원 담당.
- 콤보/배율, 탄약 제한 — 요청받지 않음.
- 자동화 테스트 — 레포에 테스트 프레임워크가 없어 추가하지 않는다. `npm run lint` +
  `npm run build` + 로컬 플레이 확인으로 검증한다.

## 완료 기준

- `/games/clay-shooting` 접속 가능.
- 시작 → 플레이(60초, 클레이 페어 스폰) → 종료 → 결과(통과/실패) → 다시 하기 흐름이 동작.
- 모바일 화면에서도 탭으로 조작 가능 (brick-breaker의 pointer 이벤트 방식 참고).
- 브라우저 콘솔에 오류 없음.
- `npm run lint`, `npm run build` 통과.
- `src/games/clay-shooting/`, `src/app/games/clay-shooting/` 밖의 파일은 수정하지 않음.
