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
      <section className="relative isolate min-h-[min(92vh,820px)] overflow-hidden">
        <div className="mesh-grid absolute inset-0 opacity-80" aria-hidden />
        <HeroMesh />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-5 pb-20 pt-16 md:px-8 md:pt-24">
          <p className="animate-fade-up font-display text-4xl font-extrabold tracking-tight text-ink md:text-6xl lg:text-7xl">
            A2AConnect
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-3xl font-display text-2xl font-semibold leading-tight text-ink-soft md:text-4xl">
            Hand off work across any agent runtime — without sharing an SDK.
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 max-w-2xl text-base text-ink-mute md:text-lg">
            The SDK-agnostic interop layer for multi-agent fleets. LF A2A–compatible. Complements MCP.
            Python runtime. Site at{" "}
            <a href="https://a2aconnect.dev" className="font-medium text-signal-dim hover:underline">
              a2aconnect.dev
            </a>
            .
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <HashLink
              href="/#quickstart"
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dim"
            >
              Get started
            </HashLink>
            <Link
              href="/examples"
              className="rounded-md border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal/40 hover:bg-white"
            >
              See real example
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-fits" className="scroll-mt-24 border-y border-ink/5 bg-white/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">How it fits together</h2>
            <p className="mt-3 text-ink-mute">
              Peers exchange typed envelopes over a pluggable transport. Adapters wrap your existing brains.
              Policy and audit sit at the boundary. LF A2A for peers on the wire; MCP for tools.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-mute md:text-base">
              <li>
                <span className="font-semibold text-ink">Discovery</span> — hello / hello.ack, then
                capabilities.query → announce.
              </li>
              <li>
                <span className="font-semibold text-ink">Negotiation</span> — offers list required
                capabilities; mismatches reject cleanly.
              </li>
              <li>
                <span className="font-semibold text-ink">Handoff</span> — offer → accept → start →
                progress/events → result.
              </li>
              <li>
                <span className="font-semibold text-ink">Governance</span> — policy allowlists and audit
                trails for production.
              </li>
            </ul>
            <Link href="/architecture" className="mt-6 inline-block text-sm font-semibold text-signal-dim hover:underline">
              Full architecture →
            </Link>
          </div>
          <ArchitectureDiagram compact />
        </div>
      </section>

      <section id="quickstart" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">Get started</h2>
        <p className="mt-3 max-w-2xl text-ink-mute">
          Install the package, run the research-handoff quickstart, then the full cross-runtime demo
          (orchestrator → researcher → writer).
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <CodeBlock code={install} label="shell" />
          <CodeBlock code={quickstart} label="demos/quickstart.py" />
        </div>
        <p className="mt-4 text-sm text-ink-mute">
          Walk the full two-agent path on the{" "}
          <Link href="/examples" className="font-medium text-signal-dim hover:underline">
            examples page
          </Link>
          .
        </p>
      </section>

      <section className="bg-ink text-mist">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Open-core, sellable fleet control</h2>
          <p className="mt-3 max-w-2xl text-mist/70">
            OSS forever for the runtime. Charge when fleets go multi-team — not for inventing a wire
            protocol.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
              <div key={tier.title} className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
                <p className="font-display font-semibold text-signal-bright">{tier.title}</p>
                <p className="mt-2 text-sm text-mist/70">{tier.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
