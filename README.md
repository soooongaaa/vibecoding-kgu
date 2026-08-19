# vibecoding-kgu

경기대학교 바이브코딩 팀 프로젝트입니다. Next.js App Router와 Supabase 인증을 사용합니다.

**배포 주소: https://vibecoding-kgu.vercel.app**

`main` 브랜치에 푸시하면 Vercel이 자동으로 프로덕션 배포합니다.

## 스택

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| 스타일 | CSS |
| 인증·DB | Supabase |
| 배포 | Vercel |

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

`.env.local`에 필요한 값:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

Supabase Authentication에서 이메일 로그인을 활성화하고, URL 설정에 로컬 및 Vercel 콜백 주소를 등록해야 합니다.

## 구조

```
src/app/login/           # 로그인·회원가입 화면
src/app/auth/callback/   # 이메일 인증 콜백
src/lib/supabase/        # 브라우저·서버 Supabase 클라이언트
docs/MAIN.md             # main 브랜치 규칙
docs/DEV.md              # dev 브랜치 규칙
docs/FEATURE.md          # feature 브랜치 규칙
```

## 협업 흐름

```text
feature/작업명-이름 → dev → main
```

`main`과 `dev`에는 직접 push하지 않습니다. 자세한 규칙은 `docs/` 문서를 먼저 읽어 주세요.

## 하루 완성 협업 규칙

이 프로젝트는 6명이 AI를 활용해 하루 안에 작동하는 결과물을 완성하는 것을 목표로 합니다. 완벽한 설계보다 **작지만 처음부터 끝까지 실제로 실행되는 결과물**을 우선합니다.

### 브랜치 역할

| 브랜치 | 용도 | 작업 규칙 |
| --- | --- | --- |
| `main` | 발표·프로덕션 배포 | 팀장만 `dev` PR을 병합 |
| `dev` | 기능 통합·테스트 | 팀장만 feature PR을 병합 |
| `feature/작업명-이름` | 개인 기능 개발 | 팀원이 자유롭게 commit·push |

팀원은 항상 최신 `dev`에서 자기 브랜치를 만듭니다.

```bash
git switch dev
git pull origin dev
git switch -c feature/작업명-이름
```

작업이 끝나면 자기 브랜치에 push하고 `feature/작업명-이름 → dev` PR만 생성합니다. 직접 병합하지 않습니다.

```bash
git add .
git commit -m "feat: 작업 내용"
git push -u origin feature/작업명-이름
```

### 하루 일정

1. **기획 30분:** 핵심 사용자와 문제, 핵심 기능 3개 이하를 확정합니다.
2. **역할 분배:** 담당 기능과 수정할 파일이 겹치지 않도록 나눕니다.
3. **개별 개발:** 각자 feature 브랜치에서 로컬 실행까지 확인합니다.
4. **수시 통합:** 완성된 기능부터 PR로 `dev`에 모아 함께 테스트합니다.
5. **최종 점검:** 발표 2~3시간 전 신규 기능 추가를 멈추고 오류만 수정합니다.
6. **배포:** 팀장이 `dev → main` PR을 병합하고 Vercel 배포를 확인합니다.

### 권장 역할 분배

- 전체 UI와 공통 컴포넌트
- 로그인·사용자 인증
- 핵심 기능 A
- 핵심 기능 B
- Supabase 데이터 연결
- 통합 테스트·배포·발표 자료

역할은 프로젝트에 맞게 조정하되, 두 사람이 같은 파일을 동시에 크게 수정하지 않습니다.

### AI 바이브코딩 공통 지시문

모든 팀원은 AI에게 작업을 맡기기 전에 다음 내용을 전달합니다.

> 먼저 `README.md`, `AGENTS.md`, `docs/`를 모두 읽어라. 기존 구조와 기술 스택을 유지하라. 요청받은 기능 외의 파일은 임의로 수정하지 마라. `main`과 `dev`에 직접 push하지 말고 지정된 feature 브랜치에서만 작업하라. 완료 후 변경 파일, 실행 방법, 테스트 결과를 보고하라.

### 완료 기준

- 로컬에서 실행된다.
- 빌드가 통과한다.
- 담당 기능의 핵심 흐름을 직접 확인했다.
- PR 설명에 변경 파일과 테스트 결과를 작성했다.
- 팀장이 `dev`에서 통합 확인한 뒤에만 `main`에 병합한다.

## 12개 미니게임 협업 규칙

6명이 각자 미니게임 2개를 담당합니다. 충돌과 되돌리기 문제를 줄이기 위해 **게임 1개 = 브랜치 1개 = PR 1개**를 원칙으로 합니다.

### 전체 GitHub 관리 구조

Git 브랜치는 실제 폴더처럼 `main` 아래에 `dev`, `dev` 아래에 게임 브랜치가 들어가는 구조는 아닙니다. 모든 브랜치는 나란히 존재하며, **어디에서 시작하고 어디로 병합하는지**로 역할을 구분합니다.

```text
feature/game-*-a ─┐
feature/game-*-b ─┤
나머지 게임 브랜치 ├── PR → dev ── 전체 테스트 ── PR → main ── Vercel 배포
                  ┘
```

관리 원칙은 다음과 같습니다.

1. 12개 게임 브랜치는 `dev`의 코드를 기준으로 시작합니다.
2. 팀원은 배정된 게임 브랜치에만 commit·push합니다.
3. 완성된 게임은 `게임 브랜치 → dev` PR로 하나씩 모읍니다.
4. 팀장이 PR을 확인한 뒤에만 `dev`에 병합합니다.
5. 12개 게임이 모이면 `dev`에서 전체 실행·충돌·빌드를 테스트합니다.
6. 최종 확인 후 팀장이 `dev → main` PR을 병합합니다.
7. `main`에 병합되면 Vercel 프로덕션 배포가 진행됩니다.

게임 브랜치를 `main`에 바로 병합하지 않습니다. 팀원도 `dev` 또는 `main`에 직접 push하지 않습니다.

### 전체 흐름

```text
최신 dev
├── feature/game-memory-minsu → dev PR
├── feature/game-quiz-minsu   → dev PR
├── feature/game-puzzle-jiyun → dev PR
└── ...                       → dev PR

검증이 끝난 dev → main PR → Vercel 배포
```

- 두 게임을 맡았더라도 하나의 브랜치에 같이 넣지 않습니다.
- 게임 A는 배정된 A 브랜치, 게임 B는 배정된 B 브랜치에서 각각 작업합니다.
- 두 브랜치를 서로 병합하거나 한 게임의 코드를 다른 게임 브랜치에 섞지 않습니다.
- 팀원은 자기 feature 브랜치에만 push합니다. `dev`와 `main`에는 직접 push하거나 직접 병합하지 않습니다.

### 배정된 브랜치

팀장이 최신 `dev`를 기준으로 아래 12개 브랜치를 미리 만들어 두었습니다. A와 B에는 회의에서 정한 서로 다른 게임을 하나씩 구현합니다.

| 담당자 | 게임 A 브랜치 | 게임 B 브랜치 |
| --- | --- | --- |
| `soooongaaa` | `feature/game-soooongaaa-a` | `feature/game-soooongaaa-b` |
| `dbqp8009@gmail.com` | `feature/game-dbqp8009-a` | `feature/game-dbqp8009-b` |
| `woojoo22kr@gmail.com` | `feature/game-woojoo22kr-a` | `feature/game-woojoo22kr-b` |
| `joyuni@kyonggi.ac.kr` | `feature/game-joyuni-a` | `feature/game-joyuni-b` |
| `catherine0427@kyonggi.ac.kr` | `feature/game-catherine0427-a` | `feature/game-catherine0427-b` |
| `rushsis2203@gmail.com` | `feature/game-rushsis2203-a` | `feature/game-rushsis2203-b` |

### 게임 작업 시작하기

저장소를 처음 받은 뒤 자기에게 배정된 기존 브랜치로 이동합니다. 새 브랜치를 임의로 만들지 않습니다.

```bash
git fetch origin
git switch --track origin/feature/game-아이디-a
```

이미 로컬 브랜치가 만들어져 있다면 `git switch feature/game-아이디-a`만 실행합니다.

작업 중에는 자주 저장합니다.

```bash
git add .
git commit -m "feat: 게임명 미니게임 구현"
git push origin feature/game-아이디-a
```

완성되면 GitHub에서 `feature/game-아이디-a → dev` PR을 만들고 팀장에게 알립니다. PR을 직접 병합하지 않습니다. 게임 B도 같은 방식으로 배정된 B 브랜치에서 별도로 작업합니다.

### 폴더와 수정 범위

각 게임은 자기 폴더 안에 독립적으로 만듭니다.

```text
src/
├── games/
│   ├── memory/
│   ├── quiz/
│   ├── puzzle/
│   └── rhythm/
├── components/game/   # 게임 공통 UI
└── lib/game/          # 게임 공통 타입·도구
```

- 담당자는 원칙적으로 `src/games/자기-게임명/`만 수정합니다.
- 다른 사람의 게임 폴더는 수정하지 않습니다.
- 공통 파일, 전역 CSS, 패키지 설정을 바꿔야 하면 먼저 팀장과 합의합니다.
- 이미지·효과음 등 게임 전용 파일도 각 게임 폴더 안에 둡니다.

### 공통 틀을 먼저 만들기

여러 게임이 동시에 공통 코드를 만들면 충돌하기 쉽습니다. 한 명이 먼저 `feature/game-common` 브랜치에서 아래 공통 틀을 만들고 `dev`에 병합합니다. 나머지 팀원은 병합된 최신 `dev`에서 게임 브랜치를 시작합니다.

- 게임 화면 공통 레이아웃
- 시작·다시 하기 버튼
- 타이머와 점수 표시
- 결과 모달
- 게임 목록과 게임 정보 타입
- 게임 종료 시 점수·결과를 전달하는 방식

공통 틀이 병합된 뒤에는 각 게임이 제멋대로 별도 규칙을 만들지 않고 기존 틀을 사용합니다.

### 게임 하나의 최소 완료 기준

- 해당 게임 주소에 접속할 수 있다.
- 시작 → 플레이 → 종료 → 다시 하기 흐름이 동작한다.
- 점수 또는 성공·실패 결과가 표시된다.
- 모바일 화면에서도 조작할 수 있다.
- 브라우저 콘솔에 치명적인 오류가 없다.
- `npm run lint`와 `npm run build`가 통과한다.
- 담당 게임 외의 불필요한 파일을 수정하지 않았다.
- PR에 게임 설명, 실행 방법, 테스트 결과, 화면 캡처를 적었다.

### 병합 순서

1. `feature/game-common → dev`를 먼저 병합합니다.
2. 완성된 게임부터 하나씩 `feature/game-* → dev` PR로 병합합니다.
3. PR 하나를 병합할 때마다 `dev`에서 실행과 빌드를 확인합니다.
4. 문제가 생기면 다음 게임을 병합하기 전에 해결합니다.
5. 12개 게임 통합 테스트가 끝나면 팀장이 `dev → main` PR을 병합합니다.
6. GitHub가 `dev`를 삭제하라고 표시해도 삭제하지 않습니다. `dev`는 계속 사용하는 통합 브랜치입니다.

### 팀원에게 그대로 보낼 안내문

> 미니게임 하나당 브랜치 하나와 PR 하나를 사용합니다. 각자 미리 배정된 A/B 브랜치만 사용하고 새 브랜치를 임의로 만들지 마세요. A 브랜치에는 게임 하나, B 브랜치에는 다른 게임 하나만 구현하고, 원칙적으로 자기 게임 폴더만 수정해 주세요. 게임이 완성되면 해당 브랜치에 push한 뒤 `dev`로 PR을 만들고 직접 병합하지 마세요. `main`과 `dev`에는 절대 직접 push하지 않습니다.
