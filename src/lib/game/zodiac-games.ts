export type ZodiacGame = {
  slug: string;
  korean: string;
  animal: string;
  emoji: string;
  color: string;
};

export const zodiacGames: ZodiacGame[] = [
  { slug: "rat", korean: "쥐", animal: "RAT", emoji: "🐭", color: "#a7c7e7" },
  { slug: "ox", korean: "소", animal: "OX", emoji: "🐮", color: "#d9b382" },
  { slug: "tiger", korean: "호랑이", animal: "TIGER", emoji: "🐯", color: "#f6a344" },
  { slug: "rabbit", korean: "토끼", animal: "RABBIT", emoji: "🐰", color: "#f2b6c6" },
  { slug: "dragon", korean: "용", animal: "DRAGON", emoji: "🐲", color: "#70c1a1" },
  { slug: "snake", korean: "뱀", animal: "SNAKE", emoji: "🐍", color: "#93b874" },
  { slug: "horse", korean: "말", animal: "HORSE", emoji: "🐴", color: "#c78f69" },
  { slug: "sheep", korean: "양", animal: "SHEEP", emoji: "🐑", color: "#d8c8e8" },
  { slug: "monkey", korean: "원숭이", animal: "MONKEY", emoji: "🐵", color: "#e9aa6c" },
  { slug: "rooster", korean: "닭", animal: "ROOSTER", emoji: "🐔", color: "#ef8b73" },
  { slug: "dog", korean: "개", animal: "DOG", emoji: "🐶", color: "#e2bd78" },
  { slug: "pig", korean: "돼지", animal: "PIG", emoji: "🐷", color: "#efa8b8" },
];

export function getZodiacGame(slug: string) {
  return zodiacGames.find((game) => game.slug === slug);
}
