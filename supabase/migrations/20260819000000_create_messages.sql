-- 배포 연결 확인용 기본 테이블
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- 누구나 읽기 가능 (공개 데모)
drop policy if exists "messages_select_public" on public.messages;
create policy "messages_select_public"
  on public.messages
  for select
  to anon, authenticated
  using (true);

-- 누구나 작성 가능 (공개 데모 — 인증 붙이면 이 정책을 교체하세요)
drop policy if exists "messages_insert_public" on public.messages;
create policy "messages_insert_public"
  on public.messages
  for insert
  to anon, authenticated
  with check (true);

insert into public.messages (content)
select 'Supabase 연결 성공! 🎉'
where not exists (select 1 from public.messages);
