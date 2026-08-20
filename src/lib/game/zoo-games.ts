export type ZooGame = { slug: string; animal: string; emoji: string; gameName: string; color: string; href: string; available: boolean };

export const zooGames: ZooGame[] = [
  { slug: "mouse", animal: "생쥐", emoji: "🐭", gameName: "치즈 미로", color: "#91b8d7", href: "/games/cheese-circuit", available: true },
  { slug: "cow", animal: "얼룩소", emoji: "🐮", gameName: "쓰레기 피하기 드라이브", color: "#c99e72", href: "/games/obstacle-dodge", available: true },
  { slug: "tiger", animal: "호랑이", emoji: "🐯", gameName: "벽돌깨기", color: "#ed8b42", href: "/games/brick-breaker", available: true },
  { slug: "rabbit", animal: "토끼", emoji: "🐰", gameName: "두더지 잡기", color: "#eea7b8", href: "/games/whack-a-mole", available: true },
  { slug: "dragon", animal: "드래곤", emoji: "🐲", gameName: "두근두근 띠뽑기", color: "#65ad89", href: "/games/zodiac-slot", available: true },
  { slug: "snake", animal: "뱀", emoji: "🐍", gameName: "테트리스", color: "#8cb56b", href: "/games/tetris", available: true },
  { slug: "horse", animal: "말", emoji: "🐴", gameName: "반응속도 테스트", color: "#bb805d", href: "/games/reaction", available: true },
  { slug: "sheep", animal: "양", emoji: "🐑", gameName: "과일 사격", color: "#b8a6d0", href: "/games/fruit-shooting", available: true },
  { slug: "monkey", animal: "원숭이", emoji: "🐵", gameName: "왁뿌숭 ASMR", color: "#df9d5d", href: "/games/wackbbu", available: true },
  { slug: "chicken", animal: "꼬꼬닭", emoji: "🐔", gameName: "미니 셰프의 주방", color: "#e17763", href: "/games/cooking", available: true },
  { slug: "dog", animal: "강아지", emoji: "🐶", gameName: "편의점 진열!!!", color: "#d1aa66", href: "/games/shelf-stock", available: true },
  { slug: "pig", animal: "아기돼지", emoji: "🐷", gameName: "가위바위보", color: "#e891a8", href: "/games/pig-rps", available: true },
];

export function getZooGame(slug: string) { return zooGames.find((game) => game.slug === slug); }
