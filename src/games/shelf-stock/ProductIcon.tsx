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

const ICONS: Record<string, () => React.ReactElement> = {
  cola: ColaIcon,
  juice: JuiceIcon,
  water: WaterIcon,
  chips: ChipsIcon,
  chocolate: ChocolateIcon,
  cookie: CookieIcon,
  ramen: RamenIcon,
  udon: UdonIcon,
  jjajang: JjajangIcon,
  tissue: TissueIcon,
  toothbrush: ToothbrushIcon,
  battery: BatteryIcon,
};

export function ProductIcon({ product }: { product: Product }) {
  const Icon = ICONS[product.id];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <Icon />
    </svg>
  );
}
