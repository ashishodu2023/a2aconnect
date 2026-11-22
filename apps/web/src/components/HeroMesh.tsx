export function HeroMesh() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-90"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0e7c6b" stopOpacity="0" />
          <stop offset="35%" stopColor="#0e7c6b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#c47a2c" stopOpacity="0.22" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <g stroke="url(#lineGrad)" strokeWidth="1" fill="none" filter="url(#soft)">
        <path d="M60 450 C240 300, 340 250, 500 330" />
        <path d="M500 330 C640 390, 720 210, 880 250" />
        <path d="M880 250 C1000 280, 1060 390, 1140 370" />
        <path d="M180 540 C360 490, 430 570, 580 510" />
        <path d="M580 510 C740 450, 800 530, 1000 490" />
        <path d="M500 330 C520 420, 540 460, 580 510" opacity="0.5" />
      </g>
      {(
        [
          [60, 450],
          [500, 330],
          [880, 250],
          [1140, 370],
          [180, 540],
          [580, 510],
          [1000, 490],
        ] as const
      ).map(([x, y], i) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={i === 1 || i === 2 ? 4.5 : 3.25}
          className="animate-pulse-node fill-signal"
          style={{ animationDelay: `${i * 0.28}s` }}
        />
      ))}
    </svg>
  );
}
