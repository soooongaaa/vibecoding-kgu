"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NICKNAME_MAX, saveNickname, useNickname } from "@/lib/nickname";

export default function EnterPage() {
  const router = useRouter();
  const saved = useNickname();
  // 아직 아무것도 입력하지 않았으면 저장된 닉네임을 보여준다.
  // 사용자가 한 글자라도 치면 그때부터 typed 가 값을 쥔다.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState("");
  const nickname = typed ?? saved ?? "";

  function enter(event: FormEvent) {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    saveNickname(name);
    router.push("/");
  }

  return (
    <main className="page">
      <section className="card">
        <h1>동물원 입장</h1>
        <p>닉네임만 정하면 바로 들어갈 수 있어요.</p>
        <form className="form" onSubmit={enter}>
          <label>
            닉네임
            <input
              type="text"
              value={nickname}
              maxLength={NICKNAME_MAX}
              placeholder="예: 사자왕"
              onChange={(event) => {
                setTyped(event.target.value);
                if (error) setError("");
              }}
              autoFocus
            />
          </label>
          {error && <div className="message error">{error}</div>}
          <div className="actions">
            <button type="submit">입장하기</button>
          </div>
        </form>
      </section>
    </main>
  );
}
