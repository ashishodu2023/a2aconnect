import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "A2AConnect roadmap — OSS shipped, Gateway preview, LF A2A bridge, commercial tiers.",
  alternates: { canonical: "/roadmap" },
};

const shipped = [
  "Python AgentPeer + local interop profile",
  "Adapters, transports, policy & audit",
  "Executable agent→agent demos",
  "Product site at a2aconnect.dev",
  "Gateway preview (registry, token gate, rate limit)",
  "LF A2A bridge scaffold + CLI",
];

const nextUp = [
  "Multi-host HTTP peer server",
  "On-wire LF A2A bridge adapter",
  "OTLP / observability exporters",
];

const commercial = [
  { tier: "Gateway", items: ["Hosted auth & registry", "Edge routing & quotas", "Hosted audit retention"] },
  { tier: "Enterprise", items: ["SSO / SCIM", "VPC networking", "SLA & support"] },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-signal-dim">Roadmap</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-ink md:text-5xl">
        Scope expanding in the open
      </h1>
      <p className="mt-4 max-w-2xl text-ink-mute">
        OSS stays the interop runtime. Gateway and Enterprise add hosted control — not a rival wire
        standard.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-ink">Shipped</h2>
        <ul className="mt-4 space-y-2">
          {shipped.map((item) => (
            <li key={item} className="flex gap-2 text-ink-mute">
              <span className="text-signal-dim">✓</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-ink">Next</h2>
        <ul className="mt-4 space-y-2">
          {nextUp.map((item) => (
            <li key={item} className="flex gap-2 text-ink-mute">
              <span className="text-ember">→</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        {commercial.map((block) => (
          <div key={block.tier} className="rounded-xl border border-ink/10 bg-white/60 px-5 py-5">
            <p className="font-display text-lg font-semibold text-ink">{block.tier}</p>
            <ul className="mt-3 space-y-1 text-sm text-ink-mute">
              {block.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/docs" className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-dim">
          Docs
        </Link>
        <Link href="/examples" className="rounded-md border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-semibold text-ink">
          Examples
        </Link>
      </div>
    </div>
  );
}
