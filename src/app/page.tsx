import Link from "next/link";
import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="page">
      <section className="card">
        <h1>Vibecoding KGU</h1>
        {user ? (
          <>
            <p>로그인되었습니다.</p>
            <div className="message success">{user.email}</div>
            <form action={signOut} className="form">
              <button type="submit">로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <p>팀 프로젝트를 시작하려면 로그인하세요.</p>
            <Link className="button" href="/login">로그인</Link>
          </>
        )}
      </section>
    </main>
  );
}
