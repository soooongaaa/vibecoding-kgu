interface DeliveryBoxProps {
  className?: string;
  /** 뚜껑이 열리는 애니메이션은 CSS 에서 주므로 클래스를 밖에서 주입받는다 */
  flapLeftClassName?: string;
  flapRightClassName?: string;
}

export function DeliveryBox({
  className,
  flapLeftClassName,
  flapRightClassName,
}: DeliveryBoxProps) {
  return (
    <svg
      className={className}
      width="82"
      height="82"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <ellipse cx="50" cy="92" rx="29" ry="5.5" fill="rgba(90,70,40,.18)" />
      <rect
        x="16"
        y="34"
        width="68"
        height="52"
        rx="5"
        fill="#d3a068"
        stroke="#b7854f"
        strokeWidth="2.5"
      />
      <rect x="44" y="34" width="12" height="52" fill="#ecd2ae" />
      <path
        className={flapLeftClassName}
        d="M16 16 H50 V34 H16 Z"
        fill="#e3b57e"
        stroke="#b7854f"
        strokeWidth="2.5"
      />
      <path
        className={flapRightClassName}
        d="M50 16 H84 V34 H50 Z"
        fill="#e3b57e"
        stroke="#b7854f"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function PottedPlant({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="56"
      height="78"
      viewBox="0 0 56 78"
      aria-hidden="true"
    >
      <ellipse cx="28" cy="73" rx="17" ry="4.5" fill="rgba(90,70,40,.16)" />
      <path d="M28 46 C13 42 7 29 9 16 C22 18 28 31 28 46 Z" fill="#6fbd72" />
      <path d="M28 46 C43 42 49 29 47 16 C34 18 28 31 28 46 Z" fill="#4fa055" />
      <path d="M28 48 C21 35 23 22 28 11 C33 22 35 35 28 48 Z" fill="#86cf87" />
      <path
        d="M17 49 h22 l-2.6 19.5 a3.5 3.5 0 0 1-3.5 3 h-9.8 a3.5 3.5 0 0 1-3.5-3 Z"
        fill="#eba97f"
      />
      <rect x="15.5" y="45.5" width="25" height="6.5" rx="3.2" fill="#f7c39b" />
    </svg>
  );
}
