export type Stage = {
  id: number;
  name: string;
  dishEmoji: string;
  correctIngredients: string[];
};

export type BoardItem = {
  instanceId: string;
  name: string;
  emoji: string;
  isDecoy: boolean;
};

export const STAGE_TIME_LIMIT_SECONDS = 60;
export const PREVIEW_SECONDS = 3;

// Every stage draws from this same 9-item pool — whatever isn't part of a
// stage's correct set automatically becomes that stage's trap ingredients.
export const INGREDIENT_POOL = [
  "토마토 소스",
  "도우",
  "치즈",
  "감자",
  "피망",
  "올리브",
  "페퍼로니",
  "치킨",
  "고구마",
];

export const INGREDIENT_EMOJI: Record<string, string> = {
  "토마토 소스": "🍅",
  도우: "🫓",
  치즈: "🧀",
  감자: "🥔",
  피망: "🫑",
  올리브: "🫒",
  페퍼로니: "🔴",
  치킨: "🍗",
  고구마: "🍠",
};

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "치즈피자",
    dishEmoji: "🍕",
    correctIngredients: ["도우", "토마토 소스", "치즈"],
  },
  {
    id: 2,
    name: "고구마피자",
    dishEmoji: "🍕",
    correctIngredients: ["도우", "토마토 소스", "치즈", "고구마"],
  },
  {
    id: 3,
    name: "콤비네이션 피자",
    dishEmoji: "🍕",
    correctIngredients: ["도우", "토마토 소스", "치즈", "올리브", "피망", "페퍼로니"],
  },
];

export const MESSAGES = {
  wrongClick: "함정 재료예요! 처음부터 다시 도전해 보세요.",
  timeout: "시간 초과! 처음부터 다시 도전해 보세요.",
  stageClear: (clearedStageNumber: number) =>
    `${clearedStageNumber}단계 완료! 다음 단계로 이동합니다.`,
  win: (totalSeconds: string) => `총 소요시간 ${totalSeconds}초`,
};

export const SPEECH: Record<
  "idle" | "preview" | "playing" | "stageClear" | "failed" | "won",
  string
> = {
  idle: "안녕하세요! 정답 재료를 모두 골라 피자를 완성해봐요~",
  preview: "이 재료들을 기억하세요! 순서는 상관없어요.",
  playing: "빨리빨리! 정답 재료를 다 골라주세요!",
  stageClear: "완성! 정말 잘했어요 🎉",
  failed: "앗, 아쉬워요! 다시 도전해봐요",
  won: "축하해요! 전부 다 완성했어요 🎉",
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildBoard(stage: Stage): BoardItem[] {
  const decoyNames = INGREDIENT_POOL.filter((name) => !stage.correctIngredients.includes(name));
  const correctItems: BoardItem[] = stage.correctIngredients.map((name, index) => ({
    instanceId: `correct-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: false,
  }));
  const decoyItems: BoardItem[] = decoyNames.map((name, index) => ({
    instanceId: `decoy-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: true,
  }));
  return shuffle([...correctItems, ...decoyItems]);
}
