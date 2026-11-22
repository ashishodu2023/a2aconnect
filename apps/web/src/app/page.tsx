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

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[min(90vh,760px)] overflow-hidden">
        <div className="mesh-grid absolute inset-0" aria-hidden />
        <div className="noise-overlay absolute inset-0 opacity-60" aria-hidden />
        <HeroMesh />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-5 pb-24 pt-20 md:px-8 md:pt-28">
          <p className="animate-fade-up font-display text-[2.75rem] font-semibold tracking-[-0.045em] text-ink md:text-6xl lg:text-[4.25rem]">
            A2AConnect
          </p>
          <div className="animate-hairline mt-5 h-px w-24 bg-signal" aria-hidden />
          <h1 className="animate-fade-up-delay mt-6 max-w-2xl font-display text-xl font-medium leading-snug tracking-[-0.03em] text-ink-soft md:text-[1.75rem]">
            Hand off work across any agent runtime — without sharing an SDK.
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-mute">
            The interop layer for multi-agent fleets. LF A2A–compatible. Complements MCP. Python
            runtime at{" "}
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
          </div>
        </div>
      </section>

      <section id="how-it-fits" className="scroll-mt-24 border-y border-ink/8 bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <p className="section-label">Product</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
              How it fits together
            </h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-ink-mute">
              Peers exchange typed envelopes over a pluggable transport. Adapters wrap your existing
              brains. Policy and audit sit at the boundary. LF A2A for peers on the wire; MCP for
              tools.
            </p>
            <ul className="mt-8 space-y-4 text-[0.95rem] text-ink-mute">
              {[
                ["Discovery", "hello / hello.ack, then capabilities.query → announce."],
                ["Negotiation", "Offers list required capabilities; mismatches reject cleanly."],
                ["Handoff", "offer → accept → start → progress/events → result."],
                ["Governance", "Policy allowlists and audit trails for production."],
              ].map(([title, body]) => (
                <li key={title} className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-ink/8 pt-4 first:border-0 first:pt-0">
                  <span className="font-semibold tracking-[-0.02em] text-ink">{title}</span>
                  <span>{body}</span>
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
        <p className="section-label">Quickstart</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
          Get started
        </h2>
        <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-mute">
          Install the package, run the research-handoff quickstart, then the full cross-runtime demo
          (orchestrator → researcher → writer).
        </p>
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

      <section className="bg-ink text-mist">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal-bright/80">
            Commercial model
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] md:text-[1.85rem]">
            Open-core, sellable fleet control
          </h2>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-mist/60">
            OSS forever for the runtime. Charge when fleets go multi-team — not for inventing a wire
            protocol.
          </p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              {
                title: "OSS",
                body: "PyPI a2aconnect, local transports, policy/audit hooks.",
              },
              {
                title: "Gateway",
                body: "Auth, routing, rate limits, multi-tenant registry — roadmap.",
              },
              {
                title: "Enterprise",
                body: "SSO/SCIM, VPC, retention, SLA — roadmap.",
              },
            ].map((tier) => (
              <div key={tier.title} className="bg-ink px-5 py-6">
                <p className="font-display text-lg font-semibold tracking-[-0.03em] text-signal-bright">
                  {tier.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mist/60">{tier.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
