/*
 * 레벨별 최단기록 저장.
 * 서버(Supabase)가 아니라 브라우저 localStorage 만 쓰므로 이 게임 폴더 밖에 영향이 없다.
 * 사생활 보호 모드 등으로 접근이 막히면 조용히 무시하고 게임은 그대로 진행한다.
 *
 * React 에는 useSyncExternalStore 로 연결한다. 그래야
 * (1) 서버 렌더 결과와 클라이언트 첫 렌더가 어긋나지 않고,
 * (2) 이펙트 안에서 setState 를 호출하지 않아도 된다.
 */

const STORAGE_KEY = "shelf-stock:best-times";

/** 레벨 id → 클리어에 걸린 시간(초) */
export type BestTimes = Record<number, number>;

/** 서버 렌더용 고정 참조. 매번 새 객체를 주면 무한 렌더가 된다. */
const EMPTY: BestTimes = {};

const listeners = new Set<() => void>();

let snapshot: BestTimes = EMPTY;
let snapshotRaw: string | null = null;
let initialized = false;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseBestTimes(raw: string | null): BestTimes {
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;

    const result: BestTimes = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      const levelId = Number(key);
      if (Number.isFinite(levelId) && typeof value === "number" && value > 0) {
        result[levelId] = value;
      }
    }
    return result;
  } catch {
    return EMPTY;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeBestTimes(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서 기록이 바뀌어도 따라간다
  window.addEventListener("storage", notify);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", notify);
  };
}

/** 저장된 문자열이 그대로면 같은 객체를 돌려줘 불필요한 렌더를 막는다. */
export function getBestTimesSnapshot(): BestTimes {
  const raw = readRaw();
  if (!initialized || raw !== snapshotRaw) {
    snapshotRaw = raw;
    snapshot = parseBestTimes(raw);
    initialized = true;
  }
  return snapshot;
}

export function getServerBestTimes(): BestTimes {
  return EMPTY;
}

export function persistBestTimes(times: BestTimes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
  } catch {
    // 저장에 실패해도 이번 판 기록은 화면에 그대로 보여 준다
  }
  notify();
}

export function formatSeconds(seconds: number) {
  return `${seconds.toFixed(1)}초`;
}
