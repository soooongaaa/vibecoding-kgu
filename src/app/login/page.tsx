"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function signUp() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    setIsError(Boolean(error));
    setMessage(error?.message ?? "확인 이메일을 보냈습니다. 이메일에서 가입을 완료해 주세요.");
  }

  return (
    <main className="page">
      <section className="card">
        <h1>로그인</h1>
        <p>이메일과 비밀번호로 로그인하거나 회원가입하세요.</p>
        <form className="form" onSubmit={login}>
          <label>이메일
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>비밀번호
            <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {message && <div className={`message ${isError ? "error" : "success"}`}>{message}</div>}
          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? "처리 중…" : "로그인"}</button>
            <button className="secondary" type="button" disabled={loading} onClick={signUp}>회원가입</button>
          </div>
        </form>
      </section>
    </main>
  );
}
