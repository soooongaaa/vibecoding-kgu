# vibecoding-kgu

경기대학교 바이브코딩 프로젝트. Next.js(App Router) + Supabase + Vercel 배포.

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

현재 테이블:

- `public.messages` — `id`, `content`, `created_at`. RLS 켜져 있고 익명 읽기/쓰기 허용(공개 데모용). 인증을 붙이면 정책을 교체해야 합니다.

## 구조

```
src/
  app/
    page.tsx        # DB 연결 확인 + 메시지 목록/작성
    actions.ts      # 서버 액션 (메시지 저장)
  lib/supabase/
    server.ts       # 서버 컴포넌트용 클라이언트
    client.ts       # 클라이언트 컴포넌트용 클라이언트
supabase/migrations/  # SQL 마이그레이션
```
