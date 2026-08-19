import { createClient } from "@/lib/supabase/server";
import { addMessage } from "./actions";

export const dynamic = "force-dynamic";

type Message = {
  id: number;
  content: string;
  created_at: string;
};

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const messages = (data ?? []) as Message[];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">vibecoding-kgu</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Next.js + Supabase + Vercel 배포 확인용 페이지입니다.
        </p>
      </header>

      <section
        className={`rounded-lg border px-4 py-3 text-sm ${
          error
            ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {error
          ? `DB 연결 실패: ${error.message}`
          : `DB 연결 정상 — messages ${messages.length}건 조회됨`}
      </section>

      <form action={addMessage} className="flex gap-2">
        <input
          name="content"
          maxLength={500}
          required
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
        />
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          저장
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {messages.map((m) => (
          <li
            key={m.id}
            className="rounded-md border border-black/10 px-4 py-3 dark:border-white/15"
          >
            <p className="text-sm">{m.content}</p>
            <time className="text-xs text-black/45 dark:text-white/45">
              {new Date(m.created_at).toLocaleString("ko-KR")}
            </time>
          </li>
        ))}
        {messages.length === 0 && !error && (
          <li className="text-sm text-black/50 dark:text-white/50">
            아직 메시지가 없습니다.
          </li>
        )}
      </ul>
    </main>
  );
}
