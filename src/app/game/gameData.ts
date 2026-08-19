export type Stage = {
  id: number;
  name: string;
  correctSequence: string[];
  decoyNames: string[];
};

export type BoardItem = {
  instanceId: string;
  name: string;
  emoji: string;
  isDecoy: boolean;
};

export const STAGE_TIME_LIMIT_SECONDS = 60;
export const PREVIEW_SECONDS = 3;

export const INGREDIENT_EMOJI: Record<string, string> = {
  "핫도그 빵": "🥖",
  소세지: "🌭",
  머스타드: "🧴",
  케첩: "🍅",
  치즈: "🧀",
  빵: "🥖",
  딸기잼: "🍓",
  상추: "🥬",
  햄: "🍖",
  블루베리잼: "🫐",
  베이컨: "🥓",
  김: "🟩",
  밥: "🍚",
  단무지: "🟨",
  우엉: "🟫",
  당근: "🥕",
  오이: "🥒",
  계란: "🥚",
  참치: "🐟",
};

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "핫도그",
    correctSequence: ["핫도그 빵", "소세지", "머스타드"],
    decoyNames: ["케첩", "치즈"],
  },
  {
    id: 2,
    name: "샌드위치",
    correctSequence: ["빵", "딸기잼", "상추", "햄", "빵"],
    decoyNames: ["블루베리잼", "베이컨", "치즈"],
  },
  {
    id: 3,
    name: "김밥",
    correctSequence: ["김", "밥", "단무지", "우엉", "당근", "오이"],
    decoyNames: ["치즈", "계란", "참치"],
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
  idle: "안녕하세요! 순서대로 재료를 골라 요리를 완성해봐요~",
  preview: "이 순서를 잘 기억하세요!",
  playing: "빨리빨리! 순서대로 골라주세요!",
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
  const correctItems: BoardItem[] = stage.correctSequence.map((name, index) => ({
    instanceId: `correct-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: false,
  }));
  const decoyItems: BoardItem[] = stage.decoyNames.map((name, index) => ({
    instanceId: `decoy-${index}-${name}`,
    name,
    emoji: INGREDIENT_EMOJI[name],
    isDecoy: true,
  }));
  return shuffle([...correctItems, ...decoyItems]);
}
