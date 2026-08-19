# vibecoding-kgu

경기대학교 바이브코딩 팀 프로젝트입니다. Next.js App Router와 Supabase 인증을 사용합니다.

**배포 주소: https://vibecoding-kgu.vercel.app**

`main` 브랜치에 푸시하면 Vercel이 자동으로 프로덕션 배포합니다.

## 스택

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, TypeScript) |
| 스타일 | Tailwind CSS 4 |
| DB | Supabase (PostgreSQL, ap-northeast-2 서울) |
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

## DB 마이그레이션

스키마는 `supabase/migrations/`에서 관리합니다.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
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
