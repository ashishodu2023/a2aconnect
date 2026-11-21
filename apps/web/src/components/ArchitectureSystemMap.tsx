/** Full-bleed SVG: three peers on a shared bus with policy/audit and standards rails. */
export function ArchitectureSystemMap() {
  return (
    <div className="arch-rise relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-[#0f1c28] via-[#12202e] to-[#1a3040] p-4 shadow-xl shadow-ink/20 md:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(36,196,173,0.22), transparent 40%), radial-gradient(circle at 80% 70%, rgba(232,145,58,0.18), transparent 35%)",
        }}
        aria-hidden
      />
      <svg viewBox="0 0 960 520" className="relative z-[1] h-auto w-full" role="img" aria-label="A2AConnect system map">
        <defs>
          <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a9f8c" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#24c4ad" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e8913a" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="peerFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3344" />
            <stop offset="100%" stopColor="#152636" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Standards rails */}
        <rect x="36" y="28" width="200" height="64" rx="12" fill="#0f6f62" fillOpacity="0.35" stroke="#24c4ad" strokeOpacity="0.55" />
        <text x="136" y="55" textAnchor="middle" fill="#24c4ad" fontSize="13" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          LF A2A
        </text>
        <text x="136" y="74" textAnchor="middle" fill="#a8c0cf" fontSize="10" fontFamily="var(--font-mono), monospace">
          peer wire standard
        </text>

        <rect x="724" y="28" width="200" height="64" rx="12" fill="#e8913a" fillOpacity="0.18" stroke="#e8913a" strokeOpacity="0.55" />
        <text x="824" y="55" textAnchor="middle" fill="#f0a35a" fontSize="13" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          MCP
        </text>
        <text x="824" y="74" textAnchor="middle" fill="#a8c0cf" fontSize="10" fontFamily="var(--font-mono), monospace">
          tools / data plane
        </text>

        <text x="480" y="48" textAnchor="middle" fill="#e8eef3" fontSize="16" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          A2AConnect interop plane
        </text>
        <text x="480" y="68" textAnchor="middle" fill="#8aa0b2" fontSize="11" fontFamily="var(--font-body), sans-serif">
          adapters · AgentPeer · policy · audit · pluggable transport
        </text>

        {/* Transport bus */}
        <rect x="80" y="250" width="800" height="28" rx="14" fill="url(#busGrad)" filter="url(#softGlow)" className="arch-glow" />
        <text x="480" y="268" textAnchor="middle" fill="#0f1c28" fontSize="11" fontFamily="var(--font-mono), monospace" fontWeight="600">
          Transport bus · in-memory · buffered · HTTP JSON stub
        </text>

        {/* Animated path packets */}
        <path id="p1" d="M200 200 C200 230, 200 230, 200 250" fill="none" stroke="#24c4ad" strokeWidth="1.5" className="arch-dash" opacity="0.7" />
        <path id="p2" d="M480 200 C480 230, 480 230, 480 250" fill="none" stroke="#24c4ad" strokeWidth="1.5" className="arch-dash" opacity="0.7" />
        <path id="p3" d="M760 200 C760 230, 760 230, 760 250" fill="none" stroke="#e8913a" strokeWidth="1.5" className="arch-dash" opacity="0.7" />

        {/* Peers */}
        {[
          { x: 110, title: "Orchestrator", sub: "custom Python", cap: "policy owner", accent: "#24c4ad" },
          { x: 390, title: "Researcher", sub: "graph-style adapter", cap: "research.web", accent: "#24c4ad" },
          { x: 670, title: "Writer", sub: "crew-style adapter", cap: "write.brief", accent: "#e8913a" },
        ].map((peer) => (
          <g key={peer.title}>
            <rect x={peer.x} y="118" width="180" height="82" rx="14" fill="url(#peerFill)" stroke={peer.accent} strokeOpacity="0.7" />
            <circle cx={peer.x + 24} cy="148" r="6" fill={peer.accent} className="arch-glow" />
            <text x={peer.x + 40} y="144" fill="#e8eef3" fontSize="14" fontFamily="var(--font-display), sans-serif" fontWeight="700">
              {peer.title}
            </text>
            <text x={peer.x + 40} y="162" fill="#8aa0b2" fontSize="10" fontFamily="var(--font-body), sans-serif">
              {peer.sub}
            </text>
            <text x={peer.x + 16} y="184" fill={peer.accent} fontSize="10" fontFamily="var(--font-mono), monospace">
              {peer.cap}
            </text>
          </g>
        ))}

        {/* Policy / audit strip */}
        <rect x="120" y="320" width="320" height="72" rx="14" fill="#1e3344" stroke="#24c4ad" strokeOpacity="0.4" />
        <text x="140" y="348" fill="#24c4ad" fontSize="12" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          Policy gates
        </text>
        <text x="140" y="368" fill="#a8c0cf" fontSize="11" fontFamily="var(--font-mono), monospace">
          before_offer · before_accept · allowlists
        </text>

        <rect x="520" y="320" width="320" height="72" rx="14" fill="#1e3344" stroke="#e8913a" strokeOpacity="0.4" />
        <text x="540" y="348" fill="#f0a35a" fontSize="12" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          Audit trail
        </text>
        <text x="540" y="368" fill="#a8c0cf" fontSize="11" fontFamily="var(--font-mono), monospace">
          MemoryAuditLog · hello → result lifecycle
        </text>

        {/* Envelope strip */}
        <rect x="160" y="420" width="640" height="64" rx="14" fill="#152636" stroke="#5c6f82" strokeOpacity="0.5" />
        <text x="480" y="446" textAnchor="middle" fill="#e8eef3" fontSize="12" fontFamily="var(--font-display), sans-serif" fontWeight="700">
          Typed JSON envelope
        </text>
        <text x="480" y="466" textAnchor="middle" fill="#8aa0b2" fontSize="10" fontFamily="var(--font-mono), monospace">
          v · id · type · from · to · ts · correlationId · sessionId · payload
        </text>

        <path d="M280 392 V420" stroke="#24c4ad" strokeWidth="1.25" className="arch-dash" opacity="0.5" />
        <path d="M680 392 V420" stroke="#e8913a" strokeWidth="1.25" className="arch-dash" opacity="0.5" />
      </svg>
    </div>
  );
}
