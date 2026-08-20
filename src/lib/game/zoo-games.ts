export type ZooGame = { slug: string; animal: string; emoji: string; gameName: string; color: string; href: string; available: boolean };

export const zooGames: ZooGame[] = [
  { slug: "mouse", animal: "생쥐", emoji: "🐭", gameName: "치즈 미로", color: "#91b8d7", href: "/games/cheese-circuit", available: true },
  { slug: "cow", animal: "얼룩소", emoji: "🐮", gameName: "초원 달리기", color: "#c99e72", href: "/games/cow", available: false },
  { slug: "tiger", animal: "호랑이", emoji: "🐯", gameName: "벽돌깨기", color: "#ed8b42", href: "/games/brick-breaker", available: true },
  { slug: "rabbit", animal: "토끼", emoji: "🐰", gameName: "당근 잡기", color: "#eea7b8", href: "/games/rabbit", available: false },
  { slug: "dragon", animal: "드래곤", emoji: "🐲", gameName: "구름 비행", color: "#65ad89", href: "/games/dragon", available: false },
  { slug: "snake", animal: "뱀", emoji: "🐍", gameName: "꼬불꼬불 길찾기", color: "#8cb56b", href: "/games/snake", available: false },
  { slug: "horse", animal: "말", emoji: "🐴", gameName: "초고속 레이스", color: "#bb805d", href: "/games/horse", available: false },
  { slug: "sheep", animal: "양", emoji: "🐑", gameName: "꿈나라 메모리", color: "#b8a6d0", href: "/games/sheep", available: false },
  { slug: "monkey", animal: "원숭이", emoji: "🐵", gameName: "왁뿌숭 ASMR", color: "#df9d5d", href: "/games/wackbbu", available: true },
  { slug: "chicken", animal: "꼬꼬닭", emoji: "🐔", gameName: "리듬 타임", color: "#e17763", href: "/games/chicken", available: false },
  { slug: "dog", animal: "강아지", emoji: "🐶", gameName: "냄새 탐정", color: "#d1aa66", href: "/games/dog", available: false },
  { slug: "pig", animal: "아기돼지", emoji: "🐷", gameName: "가위바위보", color: "#e891a8", href: "/games/pig-rps", available: true },
];

export function getZooGame(slug: string) { return zooGames.find((game) => game.slug === slug); }
