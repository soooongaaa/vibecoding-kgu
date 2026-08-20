// 바닐라 게임용 구출 신호.
// src/lib/rescue.ts 와 같은 localStorage 키·이벤트를 쓴다. 둘 중 하나만 고치면 어긋난다.

const KEY = 'zoo:rescued';
const LAST_KEY = 'zoo:last-rescued';
const EVENT = 'zoo:rescue-change';

export function rescue(slug) {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    const safe = Array.isArray(list) ? list.filter((v) => typeof v === 'string') : [];
    if (!safe.includes(slug)) {
      window.localStorage.setItem(KEY, JSON.stringify([...safe, slug]));
    }
    window.localStorage.setItem(LAST_KEY, slug);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}
