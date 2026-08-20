// 구출한 동물 기록.
//
// 닉네임과 같은 방식이다. localStorage 는 서버에 없으므로 useSyncExternalStore 로
// 구독한다. useEffect 로 읽어 setState 하면 계단식 렌더가 생긴다.
//
// 게임 쪽에서는 rescue(slug) 한 줄만 부르면 된다. 허브가 알아서 반응한다.

import { useSyncExternalStore } from "react";

const KEY = "zoo:rescued";
const LAST_KEY = "zoo:last-rescued";
const EVENT = "zoo:rescue-change";

function readRaw(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// useSyncExternalStore 는 getSnapshot 이 매번 같은 참조를 돌려주길 요구한다.
// 새 배열을 만들어 반환하면 무한 렌더에 빠지므로 내용이 같으면 이전 것을 그대로 준다.
let cache: string[] = [];
let cacheKey = "";

function getSnapshot(): string[] {
  const list = readRaw();
  const key = list.join(",");
  if (key !== cacheKey) {
    cacheKey = key;
    cache = list;
  }
  return cache;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const EMPTY: string[] = [];

/** 구출된 동물 slug 목록. 서버 렌더와 hydration 시점에는 빈 배열이다. */
export function useRescued(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/** 게임이 클리어 순간에 부른다. 이미 구출한 동물이면 아무 일도 없다. */
export function rescue(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = readRaw();
    if (!list.includes(slug)) {
      window.localStorage.setItem(KEY, JSON.stringify([...list, slug]));
    }
    // 허브가 "방금 구출된 동물"만 골라 연출하려고 쓴다.
    window.localStorage.setItem(LAST_KEY, slug);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

/** 방금 구출된 동물. 허브가 이 동물에만 해방 연출을 재생한다. */
export function useLastRescued(): string | null {
  return useSyncExternalStore(subscribe, readLast, () => null);
}

function readLast(): string | null {
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

/** 연출이 끝나면 지운다. effect 가 아니라 애니메이션 종료 핸들러에서 부른다. */
export function clearLastRescued(): void {
  try {
    if (!window.localStorage.getItem(LAST_KEY)) return;
    window.localStorage.removeItem(LAST_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

export function resetRescue(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LAST_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}
