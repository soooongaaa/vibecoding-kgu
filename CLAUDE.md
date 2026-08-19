# Claude Code 프로젝트 규칙

작업을 시작하기 전에 반드시 아래 순서로 읽는다.

1. `README.md`
2. `AGENTS.md`
3. `docs/FEATURE.md`
4. 담당 게임 폴더의 기존 파일

## 절대 규칙

- 브랜치 흐름은 `게임 브랜치 → dev → main`이다.
- 팀원은 배정된 `feature/game-아이디-a` 또는 `feature/game-아이디-b`에서만 작업한다.
- `main`과 `dev`에서 commit, push, merge, rebase하지 않는다.
- 게임 브랜치를 `main`에 직접 병합하지 않는다.
- PR의 base는 반드시 `dev`로 한다. 병합은 팀장만 한다.
- force-push, `git reset --hard`, `git clean -fd`를 실행하지 않는다.
- 작업 시작 전에 현재 브랜치와 `git status`를 확인한다.
- 담당 게임 폴더 밖의 파일은 요청 없이 수정하지 않는다.
- 공통 컴포넌트, 전역 CSS, 패키지 설정 변경이 필요하면 구현을 멈추고 팀장에게 먼저 알린다.
- `.env`, `.env.local`, Supabase 키 등 비밀값을 commit하지 않는다.

## 구현 규칙

- 기존 Next.js App Router와 TypeScript 구조를 유지한다.
- Next.js 코드를 수정하기 전에 `AGENTS.md`의 안내에 따라 설치된 Next.js 문서를 확인한다.
- 게임 하나는 독립된 `src/games/<game-slug>/` 폴더에 구현한다.
- 시작, 플레이, 종료, 결과, 다시 하기 흐름을 모두 제공한다.
- 공통 게임 UI와 타입이 이미 있으면 새로 만들지 말고 재사용한다.
- 요청받지 않은 리팩터링이나 다른 게임 수정은 하지 않는다.

## 완료 규칙

- `npm run lint`와 `npm run build`를 실행한다.
- 변경 파일이 담당 범위에 있는지 `git diff --stat`으로 확인한다.
- 자기 게임 브랜치에만 push한다.
- `게임 브랜치 → dev` PR에 구현 내용, 테스트 결과, 화면 캡처를 적는다.
- PR을 직접 병합하지 않는다.

게임을 시작할 때 `/game-start a 게임명` 또는 `/game-start b 게임명`을 사용하고, 완료할 때 `/game-finish`를 사용한다.
