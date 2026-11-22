import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { CodeBlock } from "@/components/CodeBlock";
import { HashLink } from "@/components/HashLink";
import { HeroMesh } from "@/components/HeroMesh";
import Link from "next/link";

const install = `python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
python demos/support_desk.py      # support agent→agent
python demos/incident_handoff.py  # incident agent→agent
python demos/two_agents.py        # cross-runtime brief
python demos/quickstart.py`;

const quickstart = `import asyncio, json
from a2aconnect import AgentPeer, MemoryAuditLog, create_bus
from a2aconnect.adapters import from_async_fn

async def research_run(input, ctx):
    topic = (input or {}).get("topic", ctx.offer["goal"])
    await ctx.report_progress(percent=40, message=f"Researching {topic}")
    await ctx.emit_event(
        name="source.found",
        data={"title": f"{topic} overview"},
    )
    return {
        "topic": topic,
        "findings": [
            f"{topic}: fleets need a shared handoff layer",
            "LF A2A is the wire standard; A2AConnect is the runtime",
        ],
    }

async def main():
    bus = create_bus()
    audit = MemoryAuditLog()

    researcher = AgentPeer(
        profile={
            "id": "researcher",
            "name": "Researcher",
            "capabilities": [{"name": "research.web", "version": "1"}],
        },
        transport=bus.create_transport("researcher"),
        handlers={"research.web": from_async_fn(research_run)},
    )
    orchestrator = AgentPeer(
        profile={
            "id": "orchestrator",
            "name": "Orchestrator",
            "capabilities": [],
        },
        transport=bus.create_transport("orchestrator"),
        audit=audit,
    )

    researcher.start()
    orchestrator.start()

    await orchestrator.hello("researcher")
    outcome = await orchestrator.offer_task(
        to="researcher",
        goal="Research agent interop",
        input={"topic": "agent interop runtimes"},
        required_capabilities=["research.web"],
    )
    print(json.dumps(outcome["result"]["output"], indent=2))

asyncio.run(main())
# full file: demos/quickstart.py`;

const lifecycle = [
  { title: "Discovery", body: "hello / hello.ack, then capabilities.query → announce.", tone: "signal" as const },
  { title: "Negotiation", body: "Offers list required capabilities; mismatches reject cleanly.", tone: "signal" as const },
  { title: "Handoff", body: "offer → accept → start → progress/events → result.", tone: "ember" as const },
  { title: "Governance", body: "Policy allowlists and audit trails for production.", tone: "ember" as const },
];

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[min(90vh,760px)] overflow-hidden">
        <div className="mesh-grid absolute inset-0" aria-hidden />
        <div className="noise-overlay absolute inset-0 opacity-60" aria-hidden />
        <HeroMesh />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-5 pb-24 pt-20 md:px-8 md:pt-28">
          <div className="animate-fade-up mb-6 flex flex-wrap gap-2">
            <span className="flow-chip">LF A2A · peer wire</span>
            <span className="flow-chip--ember flow-chip">MCP · tools plane</span>
            <span className="flow-chip">Python runtime</span>
          </div>
          <p className="animate-fade-up font-display text-[2.75rem] font-semibold tracking-[-0.045em] text-ink md:text-6xl lg:text-[4.25rem]">
            A2AConnect
          </p>
          <div className="animate-hairline mt-5 h-px w-28 bg-gradient-to-r from-signal via-signal-bright to-ember" aria-hidden />
          <h1 className="animate-fade-up-delay mt-6 max-w-2xl font-display text-xl font-medium leading-snug tracking-[-0.03em] text-ink-soft md:text-[1.75rem]">
            Hand off work across any agent runtime — without sharing an SDK.
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-mute">
            The interop layer for multi-agent fleets. Adapters, AgentPeer, policy & audit on a pluggable
            transport — complementary to LF A2A and MCP. Live at{" "}
            <a href="https://a2aconnect.dev" className="font-medium text-signal-dim underline-offset-2 hover:underline">
              a2aconnect.dev
            </a>
            .
          </p>
          <div className="animate-fade-up-delay-2 mt-9 flex flex-wrap gap-3">
            <HashLink href="/#quickstart" className="btn-primary">
              Get started
            </HashLink>
            <Link href="/examples" className="btn-secondary">
              See real examples
            </Link>
            <Link href="/architecture" className="btn-secondary">
              System map
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-fits" className="scroll-mt-24 border-y border-ink/8 bg-white/55">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <p className="section-label">Product</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
              How it fits together
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-mute">
              Peers exchange typed envelopes over a pluggable transport. Adapters wrap your existing
              brains. Policy and audit sit at the boundary.
            </p>
            <div className="mt-5 bus-bar max-w-md" aria-hidden />
            <ul className="mt-8 space-y-3">
              {lifecycle.map((step) => (
                <li
                  key={step.title}
                  className={`rounded-xl border bg-white/80 px-4 py-3.5 ${
                    step.tone === "ember"
                      ? "border-ember/25 shadow-[0_0_0_1px_rgba(232,145,58,0.04)]"
                      : "border-signal/25 shadow-[0_0_0_1px_rgba(36,196,173,0.04)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={step.tone === "ember" ? "tier-dot tier-dot--ember" : "tier-dot"} />
                    <span className="font-display text-sm font-semibold tracking-[-0.02em] text-ink">
                      {step.title}
                    </span>
                    <span
                      className={`ml-auto font-mono text-[10px] uppercase tracking-[0.12em] ${
                        step.tone === "ember" ? "text-ember" : "text-signal-dim"
                      }`}
                    >
                      {step.tone === "ember" ? "lifecycle" : "control"}
                    </span>
                  </div>
                  <p className="mt-2 pl-[18px] text-sm leading-relaxed text-ink-mute">{step.body}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/architecture"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.01em] text-signal-dim transition hover:text-signal"
            >
              Full architecture
              <span aria-hidden>→</span>
            </Link>
          </div>
          <ArchitectureDiagram compact />
        </div>
      </section>

      <section id="quickstart" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Quickstart</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
              Get started
            </h2>
            <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-mute">
              Install the package, run the research-handoff quickstart, then the full cross-runtime demo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="flow-chip">demos/quickstart.py</span>
            <span className="flow-chip--ember flow-chip">no API keys</span>
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <CodeBlock code={install} label="shell" />
          <CodeBlock code={quickstart} label="demos/quickstart.py" />
        </div>
        <p className="mt-5 text-sm text-ink-mute">
          Walk the full two-agent path on the{" "}
          <Link href="/examples" className="font-medium text-signal-dim underline-offset-2 hover:underline">
            examples page
          </Link>
          .
        </p>
      </section>

      <section id="whats-next" className="scroll-mt-24 relative overflow-hidden bg-gradient-to-br from-[#0f1c28] via-[#12202e] to-[#1a3040] text-mist">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(36,196,173,0.22), transparent 42%), radial-gradient(circle at 85% 70%, rgba(232,145,58,0.18), transparent 38%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal-bright">
            Product surfaces
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.035em] md:text-[1.85rem]">
            Next · Gateway · Enterprise
          </h2>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-mist/65">
            Next, Gateway, and Enterprise ship as runnable previews — try{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-signal-bright">
              python demos/next_stack.py
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-signal-bright">
              python demos/gateway_enterprise.py
            </code>
            . Hosted multi-tenant control remains the commercial layer.
          </p>

          <div className="mt-6 bus-bar" aria-hidden />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="tier-card tier-card--muted">
              <div className="relative flex items-center gap-2">
                <span className="tier-dot tier-dot--ember" />
                <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-white">Next</h3>
              </div>
              <p className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-soft/80">
                shipped preview
              </p>
              <ul className="relative mt-5 space-y-3 text-sm text-mist/75">
                {[
                  "Multi-host HTTP peer server",
                  "On-wire LF A2A bridge adapter",
                  "OTLP / observability exporters",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 border-t border-white/10 pt-3 first:border-0 first:pt-0">
                    <span className="text-ember-soft">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="relative mt-5 font-mono text-[10px] leading-relaxed tracking-wide text-ember-soft/70">
                HttpPeerServer · LfA2AWireAdapter · OtlpJsonExporter
              </p>
            </div>

            <div className="tier-card">
              <div className="relative flex items-center gap-2">
                <span className="tier-dot" />
                <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-signal-bright">
                  Gateway
                </h3>
              </div>
              <p className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-signal-bright/70">
                auth · route · retain
              </p>
              <ul className="relative mt-5 space-y-3 text-sm text-mist/75">
                {[
                  "Hosted auth & registry",
                  "Edge routing & quotas",
                  "Hosted audit retention",
                ].map((item) => (
                  <li key={item} className="border-t border-signal/20 pt-3 first:border-0 first:pt-0">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="relative mt-5 font-mono text-[10px] leading-relaxed tracking-wide text-signal-bright/60">
                HostedAuthStore · EdgeRouter · HostedAuditRetention
              </p>
            </div>

            <div className="tier-card tier-card--ember">
              <div className="relative flex items-center gap-2">
                <span className="tier-dot tier-dot--ember" />
                <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-ember-soft">
                  Enterprise
                </h3>
              </div>
              <p className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ember/80">
                identity · network · sla
              </p>
              <ul className="relative mt-5 space-y-3 text-sm text-mist/75">
                {["SSO / SCIM", "VPC networking", "SLA & support"].map((item) => (
                  <li key={item} className="border-t border-ember/25 pt-3 first:border-0 first:pt-0">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="relative mt-5 font-mono text-[10px] leading-relaxed tracking-wide text-ember-soft/70">
                SsoSessionStore · ScimDirectory · VpcNetworkPolicy · SlaTracker
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
