// 닉네임은 브라우저에만 둔다. 서버도 DB도 쓰지 않으므로 환경변수 없이 동작한다.
//
// 진짜 인증이 아니다. 아무나 아무 이름이나 쓸 수 있고 브라우저를 바꾸면 사라진다.
// 미니게임 모음에는 그걸로 충분하다.
//
// localStorage 는 서버에 없다. useEffect 로 읽어 setState 하면 계단식 렌더가 생겨
// react-hooks/set-state-in-effect 에 걸린다. 외부 저장소를 구독하는 일이므로
// useSyncExternalStore 로 읽는다.

import { useSyncExternalStore } from "react";

const KEY = "zoo:nickname";
const EVENT = "zoo:nickname-change";

export const NICKNAME_MAX = 12;

function read(): string | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw && raw.trim() ? raw : null;
  } catch {
    // 사파리 프라이빗 모드처럼 localStorage 가 막힌 환경에서도 죽지 않는다.
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  // 같은 탭의 변경은 storage 이벤트가 오지 않으므로 직접 알린다.
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function saveNickname(name: string): void {
  try {
    window.localStorage.setItem(KEY, name.trim().slice(0, NICKNAME_MAX));
  } catch {
    // 저장에 실패해도 이번 세션은 그대로 진행한다.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearNickname(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
  window.dispatchEvent(new Event(EVENT));
}

/** 저장된 닉네임. 서버 렌더와 hydration 시점에는 항상 null 이다. */
export function useNickname(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** 브라우저에서 첫 렌더가 끝났는지. 서버 HTML 과 어긋나지 않게 화면을 늦춘다. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
