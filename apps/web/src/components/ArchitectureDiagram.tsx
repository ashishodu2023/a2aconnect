const layers = [
  {
    step: "01",
    title: "Agent brains",
    detail: "Your runtimes stay yours — Python, LangGraph-shaped graphs, CrewAI-shaped roles, OpenAI agents, or custom asyncio.",
    chips: ["Python", "LangGraph-shaped", "CrewAI-shaped", "custom"],
    accent: "signal",
  },
  {
    step: "02",
    title: "Runtime adapters",
    detail: "RuntimeAdapter → TaskHandler via from_async_fn. No hard SDK lock-in; wrap the brain you already run.",
    chips: ["from_async_fn", "graph-style", "crew-style"],
    accent: "signal",
  },
  {
    step: "03",
    title: "AgentPeer + governance",
    detail: "Handshake, capability negotiation, offer/accept, progress, events, result. Policy allowlists and MemoryAuditLog sit at the boundary.",
    chips: ["hello", "offer_task", "policy", "audit"],
    accent: "ember",
  },
  {
    step: "04",
    title: "Pluggable transport",
    detail: "Same envelopes over in-memory bus (dev), outbound buffer (backpressure), or HTTP JSON stub (edge).",
    chips: ["in-memory", "buffered", "HTTP JSON"],
    accent: "signal",
  },
  {
    step: "05",
    title: "Local interop profile",
    detail: "Typed JSON messages mapped conceptually to LF A2A task lifecycle. Complements MCP for tools — does not replace either standard.",
    chips: ["hello.*", "capabilities.*", "task.*", "event"],
    accent: "ember",
  },
];

export function ArchitectureDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      {layers.map((layer, i) => (
        <div key={layer.title} className={compact ? undefined : `arch-rise-${Math.min(i + 1, 4)}`}>
          <div
            className={`arch-layer rounded-xl border border-ink/10 bg-white/70 px-4 py-3 backdrop-blur-sm md:px-5 md:py-4 ${
              layer.accent === "ember" ? "hover:border-ember/40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 font-mono text-[11px] font-semibold tracking-wider ${
                  layer.accent === "ember" ? "text-ember" : "text-signal-dim"
                }`}
              >
                {layer.step}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-ink md:text-base">{layer.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-mute">{layer.detail}</p>
                {!compact ? (
                  <p className="mt-2.5 font-mono text-[10px] tracking-wide text-ink-soft/90">
                    {layer.chips.join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          {i < layers.length - 1 ? (
            <div className="mx-auto flex h-4 w-px items-center justify-center bg-gradient-to-b from-signal/60 to-ember/40" aria-hidden />
          ) : null}
        </div>
      ))}
      <div className="grid gap-3 pt-3 md:grid-cols-2">
        <div className="rounded-xl border border-signal/30 bg-signal/5 px-4 py-3">
          <p className="font-display text-sm font-semibold text-signal-dim">LF A2A</p>
          <p className="mt-1 text-sm text-ink-mute">
            Industry peer wire standard. A2AConnect maps profile ≈ Agent Card, task.* ≈ Task lifecycle — does not replace it.
          </p>
        </div>
        <div className="rounded-xl border border-ember/30 bg-ember/5 px-4 py-3">
          <p className="font-display text-sm font-semibold text-ember">MCP</p>
          <p className="mt-1 text-sm text-ink-mute">
            Agent ↔ tools/data. Orthogonal vertical: use MCP for tools, A2AConnect for peer handoff.
          </p>
        </div>
      </div>
    </div>
  );
}
