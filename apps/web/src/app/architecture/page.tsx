import type { Metadata } from "next";
import Link from "next/link";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { ArchitectureLifecycle } from "@/components/ArchitectureLifecycle";
import { ArchitectureSystemMap } from "@/components/ArchitectureSystemMap";
import { HashLink } from "@/components/HashLink";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "Detailed A2AConnect architecture — system map, lifecycle flows, envelopes, transports, and LF A2A / MCP placement.",
  alternates: { canonical: "/architecture" },
};

const envelopeFields = [
  { name: "v", meaning: "Profile version" },
  { name: "id", meaning: "Message id" },
  { name: "type", meaning: "hello · task.offer · event · …" },
  { name: "from / to", meaning: "Agent ids on the bus" },
  { name: "ts", meaning: "Unix timestamp" },
  { name: "sessionId", meaning: "Bound at hello.ack" },
  { name: "correlationId", meaning: "Ties offer → result" },
  { name: "payload", meaning: "Typed body for the message" },
];

const transports = [
  {
    name: "In-memory bus",
    use: "Local demos & tests",
    detail: "create_bus() fans envelopes between AgentPeer transports in one process.",
  },
  {
    name: "Outbound buffer",
    use: "Backpressure",
    detail: "with_outbound_buffer() queues sends so slow peers do not stall producers.",
  },
  {
    name: "HTTP JSON stub",
    use: "Edge / multi-host",
    detail: "Same envelope over HTTP — swap transport without rewriting peer logic.",
  },
];

const mapRows = [
  { local: "Agent profile + capabilities", a2a: "Agent Card", note: "Discovery surface" },
  { local: "task.offer → result / failed", a2a: "Task lifecycle", note: "Handoff semantics" },
  { local: "task.progress + event", a2a: "Streaming updates", note: "Same transport" },
  { local: "Policy + audit hooks", a2a: "Product governance", note: "A2AConnect layer" },
  { local: "MCP (orthogonal)", a2a: "—", note: "Tools / data, not peers" },
];

export default function ArchitecturePage() {
  return (
    <div className="pb-20">
      {/* Hero band */}
      <section className="relative overflow-hidden border-b border-ink/8">
        <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <p className="arch-rise section-label">Architecture</p>
          <h1 className="arch-rise-2 mt-4 max-w-3xl font-display text-3xl font-semibold tracking-[-0.04em] text-ink md:text-[2.75rem]">
            The interop plane between agent brains — detailed.
          </h1>
          <p className="arch-rise-3 mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink-mute">
            A2AConnect is the product layer that makes mixed-runtime fleets operable: adapters, AgentPeer,
            policy, audit, and pluggable transport. It maps to LF A2A and sits beside MCP — it does not
            invent a rival wire standard.
          </p>
        </div>
      </section>

      {/* System map */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">System map</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
              Three peers. One bus. Governed handoff.
            </h2>
          </div>
          <p className="max-w-md text-sm text-ink-mute">
            Orchestrator (policy owner) → researcher (graph-style) → writer (crew-style), with audit on
            every lifecycle edge.
          </p>
        </div>
        <ArchitectureSystemMap />
      </section>

      {/* Stack + standards */}
      <section className="border-y border-ink/5 bg-white/35">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-16">
          <div>
            <p className="section-label">Stack layers</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">Top to bottom</h2>
            <p className="mt-3 text-sm text-ink-mute">
              Each layer has one job. Brains stay swappable; the envelope and governance stay stable.
            </p>
            <div className="mt-8">
              <ArchitectureDiagram />
            </div>
          </div>
          <div>
            <p className="section-label !text-ember">Standards map</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">Where LF A2A & MCP sit</h2>
            <p className="mt-3 text-sm text-ink-mute">
              Local interop profile for DX and tests; conceptual bridge to LF A2A as the wire standard. MCP remains
              the tools plane.
            </p>
            <div className="mt-8 overflow-hidden rounded-sm border border-ink/10 bg-white/80">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[10px] uppercase tracking-wider text-ink-mute">
                  <tr>
                    <th className="px-4 py-3 font-medium">A2AConnect</th>
                    <th className="px-4 py-3 font-medium">LF A2A</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {mapRows.map((row) => (
                    <tr key={row.local} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{row.local}</td>
                      <td className="px-4 py-3 font-mono text-xs text-signal-dim">{row.a2a}</td>
                      <td className="hidden px-4 py-3 text-ink-mute sm:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="section-label">Connection lifecycle</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.85rem]">
          From hello to audited result
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink-mute">
          Five phases on one transport. Streaming progress and events never leave the envelope model.
        </p>
        <div className="mt-10">
          <ArchitectureLifecycle />
        </div>
      </section>

      {/* Envelope + transports */}
      <section className="border-t border-ink/5 bg-ink text-mist">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal-bright/90">Envelope</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] md:text-[1.85rem]">Every message is typed JSON</h2>
            <p className="mt-3 text-sm text-mist/70">
              Stable headers, swappable payload. Correlation and session ids stitch the handoff together.
            </p>
            <ul className="mt-8 space-y-3">
              {envelopeFields.map((f) => (
                <li key={f.name} className="flex items-baseline gap-3 border-b border-white/10 pb-3">
                  <code className="min-w-[7.5rem] font-mono text-sm text-signal-bright">{f.name}</code>
                  <span className="text-sm text-mist/75">{f.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Transports</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] md:text-[1.85rem]">Same peers, different pipes</h2>
            <p className="mt-3 text-sm text-mist/70">
              Swap the transport; keep AgentPeer, adapters, policy, and audit.
            </p>
            <div className="mt-8 space-y-4">
              {transports.map((t, i) => (
                <div
                  key={t.name}
                  className="rounded-sm border border-white/10 bg-white/5 px-4 py-4"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display font-semibold text-signal-bright">{t.name}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-mist/50">{t.use}</span>
                  </div>
                  <p className="mt-2 text-sm text-mist/70">{t.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pt-12 md:px-8">
        <p className="text-sm text-ink-mute">
          Canonical docs:{" "}
          <a href="https://a2aconnect.dev/architecture" className="text-signal-dim hover:underline">
            a2aconnect.dev/architecture
          </a>
          . Repo mirrors: <code className="font-mono text-xs">docs/architecture.md</code>,{" "}
          <code className="font-mono text-xs">protocol/SPEC.md</code>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/examples" className="btn-primary">
            See real examples
          </Link>
          <HashLink href="/#quickstart" className="btn-secondary">
            Get started
          </HashLink>
        </div>
      </section>
    </div>
  );
}
