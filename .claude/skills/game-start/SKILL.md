---
name: game-start
description: 배정된 A/B 미니게임 브랜치에서 안전하게 작업을 시작한다.
argument-hint: "[a|b] [game-name]"
disable-model-invocation: true
---

미니게임 작업을 시작한다. 인자는 `$ARGUMENTS`이다.

1. `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/FEATURE.md`를 읽는다.
2. `git status --short --branch`로 미커밋 변경과 현재 브랜치를 확인한다. 변경이 있으면 브랜치를 바꾸지 말고 사용자에게 알린다.
3. 인자의 A/B와 게임명을 확인한다. 담당자 아이디를 알 수 없으면 한 번만 질문한다.
4. `git fetch origin` 후 미리 배정된 `feature/game-<아이디>-<a|b>` 브랜치로 이동한다. 새 브랜치를 만들지 않는다.
5. 브랜치 이름과 담당 게임을 다시 출력해 사용자에게 확인시킨다.
6. `src/games/<game-slug>/` 안에서만 구현한다. 공통 파일 변경이 필요하면 먼저 사용자에게 알린다.
7. 시작 → 플레이 → 종료 → 결과 → 다시 하기 흐름을 구현한다.
8. 완료 전 `npm run lint`와 `npm run build`를 실행한다.
9. 사용자 요청 없이 `dev`나 `main`에 병합하지 않는다.
