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
