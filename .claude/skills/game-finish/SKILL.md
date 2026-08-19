---
name: game-finish
description: 현재 미니게임 작업을 검사하고 자기 브랜치에 안전하게 올릴 준비를 한다.
disable-model-invocation: true
---

현재 미니게임 작업을 마무리한다.

1. 현재 브랜치가 배정된 `feature/game-*-a` 또는 `feature/game-*-b`인지 확인한다. 아니면 중단한다.
2. `git status`, `git diff`, `git diff --stat`을 확인한다.
3. 담당 게임 밖의 불필요한 변경, 비밀값, 디버그 코드가 없는지 검사한다.
4. 시작 → 플레이 → 종료 → 결과 → 다시 하기 흐름을 확인한다.
5. `npm run lint`와 `npm run build`를 실행한다. 실패하면 고친 뒤 다시 검사한다.
6. 변경 요약과 테스트 결과를 사용자에게 보여주고 commit·push 승인을 받는다.
7. 승인 후 현재 게임 브랜치에만 commit하고 push한다.
8. `dev` 대상 PR 제목과 본문 초안을 작성한다. `main` 대상 PR은 만들지 않는다.
9. PR을 직접 병합하지 않고 팀장 검토를 기다린다.
