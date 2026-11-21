const phases = [
  {
    n: "01",
    title: "Discovery",
    wire: "hello → hello.ack",
    detail: "Peers open a session. sessionId binds later task traffic to the handshake.",
    messages: ["hello", "hello.ack", "ping", "pong"],
  },
  {
    n: "02",
    title: "Capabilities",
    wire: "capabilities.query → announce",
    detail: "Each peer advertises what it can run. Offers that require missing caps reject cleanly.",
    messages: ["capabilities.query", "capabilities.announce"],
  },
  {
    n: "03",
    title: "Negotiate",
    wire: "task.offer → accept | reject",
    detail: "requiredCapabilities, goal, input, timeout, retries. Policy may deny before accept.",
    messages: ["task.offer", "task.accept", "task.reject"],
  },
  {
    n: "04",
    title: "Execute",
    wire: "start → progress · event → result",
    detail: "Streaming progress and typed events share the transport. Buffer absorbs backpressure.",
    messages: ["task.start", "task.progress", "event", "task.result", "task.failed"],
  },
  {
    n: "05",
    title: "Govern",
    wire: "policy + audit",
    detail: "before_offer / before_accept gates. MemoryAuditLog records the full lifecycle for fleets.",
    messages: ["before_offer", "before_accept", "MemoryAuditLog"],
  },
];

export function ArchitectureLifecycle() {
  return (
    <div className="arch-rise-2 relative">
      <div className="pointer-events-none absolute left-[1.15rem] top-3 bottom-3 w-px bg-gradient-to-b from-signal via-signal/50 to-ember md:left-1/2 md:-translate-x-px" aria-hidden />
      <ol className="space-y-6 md:space-y-0 md:grid md:grid-cols-1">
        {phases.map((phase, i) => (
          <li
            key={phase.n}
            className={`relative grid gap-3 md:grid-cols-2 md:gap-10 md:items-start ${
              i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div className={`${i % 2 === 1 ? "md:text-left" : "md:text-right"} pl-10 md:pl-0`}>
              <p className="font-mono text-[11px] tracking-[0.14em] text-signal-dim">{phase.n}</p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">{phase.title}</h3>
              <p className="mt-1 font-mono text-xs text-ember">{phase.wire}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-mute">{phase.detail}</p>
            </div>
            <div className="relative pl-10 md:pl-0">
              <span className="absolute left-0 top-2 h-6 w-6 -translate-x-[0.35rem] rounded-full border-2 border-signal bg-mist md:left-1/2 md:-translate-x-1/2" aria-hidden>
                <span className="absolute inset-1 rounded-full bg-signal arch-glow" />
              </span>
              <div className="rounded-xl border border-ink/10 bg-white/60 px-4 py-3 backdrop-blur-sm">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">Wire types</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {phase.messages.map((m) => (
                    <code
                      key={m}
                      className="rounded-md bg-ink px-2 py-1 font-mono text-[11px] text-signal-bright"
                    >
                      {m}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
