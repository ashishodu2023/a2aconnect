export function HeroMesh() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a9f8c" stopOpacity="0" />
          <stop offset="40%" stopColor="#1a9f8c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e8913a" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <g stroke="url(#lineGrad)" strokeWidth="1.25" fill="none">
        <path d="M80 420 C220 280, 320 260, 480 320" />
        <path d="M480 320 C620 380, 700 220, 860 260" />
        <path d="M860 260 C980 290, 1040 400, 1120 380" />
        <path d="M200 520 C360 480, 420 560, 560 500" />
        <path d="M560 500 C720 440, 780 520, 980 480" />
      </g>
      {[[80, 420], [480, 320], [860, 260], [1120, 380], [200, 520], [560, 500], [980, 480]].map(([x, y], i) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={i === 1 || i === 2 ? 7 : 5} className="animate-pulse-node fill-signal" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </svg>
  );
}
