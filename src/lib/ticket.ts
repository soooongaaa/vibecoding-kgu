// 동물 구출권.
//
// 게임 12개를 전부 깨지 않고도 동물을 구할 수 있는 수단이다.
// 발표 시연처럼 시간이 없을 때 엔딩까지 보여주려고 만들었다.
//
// 저장 방식은 닉네임·구출 기록과 같다. localStorage 를 useSyncExternalStore 로 구독한다.

import { useSyncExternalStore } from "react";

const KEY = "zoo:tickets";
const EVENT = "zoo:ticket-change";

/** 처음 받는 구출권 수. 동물 수와 같아서 이론상 전원을 구출권으로 구할 수 있다. */
export const TICKET_TOTAL = 12;

function read(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return TICKET_TOTAL;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return TICKET_TOTAL;
    // 저장값이 망가져도 화면이 이상해지지 않게 범위를 좁힌다.
    return Math.max(0, Math.min(TICKET_TOTAL, n));
  } catch {
    return TICKET_TOTAL;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 남은 구출권. 서버 렌더와 hydration 시점에는 전량으로 본다. */
export function useTickets(): number {
  return useSyncExternalStore(subscribe, read, () => TICKET_TOTAL);
}

/** 한 장 쓴다. 남은 게 없으면 false 를 돌려주고 아무 일도 하지 않는다. */
export function spendTicket(): boolean {
  let left = 0;
  try {
    left = read();
    if (left <= 0) return false;
    window.localStorage.setItem(KEY, String(left - 1));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(EVENT));
  return true;
}

export function resetTickets(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}
