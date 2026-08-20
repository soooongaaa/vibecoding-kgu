import type React from "react";
import type { Product } from "./types";

function ColaIcon() {
  return (
    <>
      <rect x="12" y="6" width="16" height="28" rx="5" fill="#f0433a" />
      <path d="M12 11 h16 v3 a20 20 0 0 1-16 0 Z" fill="#c62828" />
      <rect x="13.5" y="18" width="13" height="5.5" rx="2" fill="#fff" opacity="0.9" />
      <circle cx="20" cy="30" r="1.6" fill="#fff" opacity="0.7" />
    </>
  );
}

function JuiceIcon() {
  return (
    <>
      <path d="M11 13 L29 13 L27 33 Q20 35 13 33 Z" fill="#ffb238" />
      <path d="M13 9 h6 l1 4 h-8 Z" fill="#ff8a3d" />
      <rect x="15.5" y="19" width="9" height="5" rx="1.5" fill="#fff" opacity="0.85" />
      <circle cx="20" cy="27" r="1.3" fill="#fff" opacity="0.6" />
    </>
  );
}

function WaterIcon() {
  return (
    <>
      <path
        d="M16 5 h8 v4.5 l3 3.5 V32 a2.5 2.5 0 0 1-2.5 2.5 h-9 A2.5 2.5 0 0 1 13 32 V13 l3-3.5 Z"
        fill="#7fd4f0"
      />
      <rect x="16" y="3" width="8" height="4" rx="1.5" fill="#4bb8e0" />
      <rect x="14.5" y="19" width="11" height="5" rx="1.5" fill="#fff" opacity="0.7" />
    </>
  );
}

function ChipsIcon() {
  return (
    <>
      <path
        d="M11 12 Q13 8 15 12 Q17 8 19 12 Q21 8 23 12 Q25 8 27 12 L25 33 Q20 35 15 33 Z"
        fill="#f6c445"
      />
      <path d="M15 17 Q20 20 25 17" stroke="#d99a1e" strokeWidth="1.4" fill="none" />
      <path d="M16 24 Q20 27 24 24" stroke="#d99a1e" strokeWidth="1.4" fill="none" />
    </>
  );
}

function ChocolateIcon() {
  return (
    <>
      <rect x="7" y="12" width="26" height="17" rx="4" fill="#8a5a34" />
      <line x1="15.5" y1="12" x2="15.5" y2="29" stroke="#6b4426" strokeWidth="1.5" />
      <line x1="24.5" y1="12" x2="24.5" y2="29" stroke="#6b4426" strokeWidth="1.5" />
      <line x1="7" y1="20.5" x2="33" y2="20.5" stroke="#6b4426" strokeWidth="1.5" />
      <circle cx="11.2" cy="16.2" r="0.9" fill="#c99a6f" />
      <circle cx="28.8" cy="25" r="0.9" fill="#c99a6f" />
    </>
  );
}

function CookieIcon() {
  return (
    <>
      <circle cx="20" cy="20" r="14" fill="#dba468" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#c78e51" strokeWidth="1.2" />
      <circle cx="15" cy="16" r="1.9" fill="#5c3820" />
      <circle cx="25" cy="15.5" r="1.9" fill="#5c3820" />
      <circle cx="27" cy="24" r="1.9" fill="#5c3820" />
      <circle cx="15.5" cy="25.5" r="1.9" fill="#5c3820" />
      <circle cx="21" cy="21" r="1.9" fill="#5c3820" />
    </>
  );
}

function RamenIcon() {
  return (
    <>
      <path d="M6 19 a14 11 0 0 0 28 0 Z" fill="#f0433a" />
      <rect x="6" y="17.5" width="28" height="2.2" rx="1.1" fill="#c62828" />
      <path
        d="M12 14 Q14 10 16 14 Q18 10 20 14 Q22 10 24 14 Q26 10 28 14"
        stroke="#fff"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M15 6 Q14 9 15.5 11" stroke="#d8d8d8" strokeWidth="1.3" fill="none" opacity="0.8" />
      <path d="M20 5 Q19 8 20.5 10" stroke="#d8d8d8" strokeWidth="1.3" fill="none" opacity="0.8" />
    </>
  );
}

function UdonIcon() {
  return (
    <>
      <path d="M6 19 a14 11 0 0 0 28 0 Z" fill="#faf3e2" />
      <rect x="6" y="17.5" width="28" height="2.2" rx="1.1" fill="#e4d6ae" />
      <path
        d="M12 15 Q14 12.5 16 15 Q18 12.5 20 15 Q22 12.5 24 15 Q26 12.5 28 15"
        stroke="#e8b74a"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="27" cy="23" r="2.6" fill="#5aa85a" />
    </>
  );
}

function JjajangIcon() {
  return (
    <>
      <path d="M6 19 a14 11 0 0 0 28 0 Z" fill="#4a2f1a" />
      <rect x="6" y="17.5" width="28" height="2.2" rx="1.1" fill="#3a2412" />
      <path
        d="M12 15 Q15 12 18 15 T24 15 T30 14"
        stroke="#6b4426"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="16" cy="24" r="1.6" fill="#2e1c0d" />
      <circle cx="23" cy="25.5" r="1.6" fill="#2e1c0d" />
    </>
  );
}

function TissueIcon() {
  return (
    <>
      <rect x="7" y="16" width="26" height="17" rx="4" fill="#7fd4f0" />
      <rect x="7" y="16" width="26" height="17" rx="4" fill="none" stroke="#4bb8e0" strokeWidth="1.2" />
      <path
        d="M14 16 Q16 9 19 16 Q21 9 24 16 Q26 9 28 16"
        fill="#fff"
        stroke="#dceff8"
        strokeWidth="0.8"
      />
    </>
  );
}

function ToothbrushIcon() {
  return (
    <>
      <rect x="6" y="19" width="19" height="4.2" rx="2.1" fill="#4bb8e0" />
      <rect x="23" y="14" width="10" height="12" rx="3" fill="#fff" stroke="#cdeaf7" strokeWidth="1" />
      <line x1="25.5" y1="17.5" x2="30.5" y2="17.5" stroke="#7fd4f0" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="25.5" y1="20.2" x2="30.5" y2="20.2" stroke="#7fd4f0" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="25.5" y1="22.9" x2="30.5" y2="22.9" stroke="#7fd4f0" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function BatteryIcon() {
  return (
    <>
      <rect x="16" y="5" width="8" height="5" rx="1.5" fill="#4a9c40" />
      <rect x="9" y="10" width="22" height="25" rx="4" fill="#7bc86c" />
      <rect x="12.5" y="20" width="15" height="8" rx="1.5" fill="#fff" opacity="0.9" />
      <path d="M20.5 21.5 L18 24.5 h2 l-1 3 l3.5 -3.5 h-2 Z" fill="#4a9c40" />
    </>
  );
}

function CoffeeIcon() {
  return (
    <>
      <rect x="13" y="6" width="14" height="28" rx="4" fill="#5b3a22" />
      <rect x="13" y="15" width="14" height="9" fill="#c9a06a" />
      <ellipse cx="20" cy="6.5" rx="7" ry="2.2" fill="#8f7255" />
      <path d="M16.5 18 h7 v3 h-7 Z" fill="#4a2c16" opacity="0.55" />
    </>
  );
}

function JellyIcon() {
  return (
    <>
      <path d="M10 14 h20 l-2 18 q-8 3-16 0 Z" fill="#f472a5" />
      <path d="M10 14 q10-6 20 0 Z" fill="#ff9dc2" />
      <circle cx="16" cy="22" r="2.2" fill="#fff" opacity="0.75" />
      <circle cx="24" cy="26" r="1.8" fill="#fff" opacity="0.6" />
    </>
  );
}

function CupRamenIcon() {
  return (
    <>
      <path d="M11 12 h18 l-2.5 22 q-6.5 2-13 0 Z" fill="#f0433a" />
      <ellipse cx="20" cy="12" rx="9" ry="2.8" fill="#ffe08a" />
      <rect x="12.5" y="19" width="15" height="5" rx="1.5" fill="#fff" opacity="0.9" />
      <path d="M14 27 h12" stroke="#c62828" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

function MaskIcon() {
  return (
    <>
      <path d="M11 14 h18 v9 q0 6-9 8 q-9-2-9-8 Z" fill="#eaf6ff" stroke="#a9d4ea" strokeWidth="1.3" />
      <path d="M11 18 h18" stroke="#c8e4f2" strokeWidth="1.2" />
      <path d="M11 22 h18" stroke="#c8e4f2" strokeWidth="1.2" />
      <path d="M11 15 q-6 3-4 8" stroke="#a9d4ea" strokeWidth="1.6" fill="none" />
      <path d="M29 15 q6 3 4 8" stroke="#a9d4ea" strokeWidth="1.6" fill="none" />
    </>
  );
}

function OnigiriIcon() {
  return (
    <>
      <path d="M20 7 L33 30 q-13 4-26 0 Z" fill="#fdfcf5" stroke="#e6e0cc" strokeWidth="1.2" />
      <path d="M12 24 h16 l1.5 6 q-9 3-18.5 0 Z" fill="#3d4a3a" />
      <circle cx="18" cy="18" r="1.2" fill="#f0a3a3" />
      <circle cx="23" cy="21" r="1.2" fill="#f0a3a3" />
    </>
  );
}

function LunchboxIcon() {
  return (
    <>
      <rect x="6" y="14" width="28" height="18" rx="3" fill="#3e4a5c" />
      <rect x="6" y="11" width="28" height="5" rx="2.5" fill="#5d6d82" />
      <rect x="9" y="19" width="10" height="10" rx="2" fill="#fdfcf5" />
      <rect x="21" y="19" width="10" height="4.5" rx="1.5" fill="#f0a34a" />
      <rect x="21" y="25" width="10" height="4" rx="1.5" fill="#7bc86c" />
    </>
  );
}

function SandwichIcon() {
  return (
    <>
      <path d="M8 30 L20 8 L32 30 Z" fill="#f6d79b" />
      <path d="M11.5 25 L20 9.5 L28.5 25 Z" fill="#fff8e8" />
      <path d="M13 22 L20 13 L27 22 Z" fill="#7bc86c" />
      <path d="M15 19 L20 16 L25 19 Z" fill="#f08a72" />
    </>
  );
}

function GimbapIcon() {
  return (
    <>
      <circle cx="20" cy="20" r="14" fill="#3d4a3a" />
      <circle cx="20" cy="20" r="11" fill="#fdfcf5" />
      <circle cx="20" cy="20" r="4" fill="#f0a34a" />
      <circle cx="16" cy="16" r="2" fill="#7bc86c" />
      <circle cx="24" cy="16.5" r="2" fill="#f08a72" />
      <circle cx="16.5" cy="24" r="2" fill="#ffd76b" />
    </>
  );
}

function ConeIcon() {
  return (
    <>
      <path d="M13 18 L20 35 L27 18 Z" fill="#e2b271" />
      <path d="M15 21 L25 21 M16 25 L24 25" stroke="#c99a5b" strokeWidth="1" />
      <circle cx="20" cy="14" r="7.5" fill="#fff0f4" />
      <circle cx="16" cy="12" r="4.5" fill="#ffc2d6" />
      <circle cx="24" cy="12.5" r="4.5" fill="#b8e5c9" />
      <circle cx="20" cy="7" r="2" fill="#f0433a" />
    </>
  );
}

function BarIcon() {
  return (
    <>
      <rect x="16" y="27" width="8" height="9" rx="2" fill="#e2b271" />
      <rect x="10" y="5" width="20" height="25" rx="7" fill="#8a5a34" />
      <rect x="12.5" y="8" width="6" height="8" rx="3" fill="#fff" opacity="0.28" />
    </>
  );
}

function CupIceIcon() {
  return (
    <>
      <path d="M11 17 h18 l-2 17 q-7 2-14 0 Z" fill="#fdfcf5" stroke="#e0dccd" strokeWidth="1.2" />
      <ellipse cx="20" cy="17" rx="9" ry="3" fill="#ffd1e0" />
      <circle cx="16" cy="14" r="4" fill="#ffc2d6" />
      <circle cx="23" cy="14.5" r="4" fill="#c9a7e8" />
      <rect x="18.5" y="20" width="3" height="13" rx="1.5" fill="#e2b271" />
    </>
  );
}

function TubeIcon() {
  return (
    <>
      <path d="M15 6 h10 v24 q0 5-5 5 t-5-5 Z" fill="#7fd4f0" />
      <rect x="14" y="4" width="12" height="4" rx="2" fill="#4bb8e0" />
      <path d="M17.5 11 v14" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </>
  );
}

const ICONS: Record<string, () => React.ReactElement> = {
  cola: ColaIcon,
  juice: JuiceIcon,
  water: WaterIcon,
  coffee: CoffeeIcon,
  chips: ChipsIcon,
  chocolate: ChocolateIcon,
  cookie: CookieIcon,
  jelly: JellyIcon,
  ramen: RamenIcon,
  udon: UdonIcon,
  jjajang: JjajangIcon,
  cupramen: CupRamenIcon,
  tissue: TissueIcon,
  toothbrush: ToothbrushIcon,
  battery: BatteryIcon,
  mask: MaskIcon,
  onigiri: OnigiriIcon,
  lunchbox: LunchboxIcon,
  sandwich: SandwichIcon,
  gimbap: GimbapIcon,
  cone: ConeIcon,
  bar: BarIcon,
  cupice: CupIceIcon,
  tube: TubeIcon,
};

export function ProductIcon({ product }: { product: Product }) {
  const Icon = ICONS[product.id];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <Icon />
    </svg>
  );
}
