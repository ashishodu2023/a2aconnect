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
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <p className="section-label">Roadmap</p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-ink md:text-[2.75rem]">
        Scope expanding in the open
      </h1>
      <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink-mute">
        OSS stays the interop runtime. Gateway and Enterprise add hosted control — not a rival wire
        standard.
      </p>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">Shipped</h2>
        <ul className="mt-5 divide-y divide-ink/8 border-y border-ink/8">
          {shipped.map((item) => (
            <li key={item} className="flex gap-3 py-3.5 text-ink-mute">
              <span className="font-mono text-xs text-signal-dim">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">Next</h2>
        <ul className="mt-5 divide-y divide-ink/8 border-y border-ink/8">
          {nextUp.map((item) => (
            <li key={item} className="flex gap-3 py-3.5 text-ink-mute">
              <span className="font-mono text-xs text-ember">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 md:grid-cols-2">
        {commercial.map((block) => (
          <div key={block.tier} className="bg-white/80 px-6 py-6">
            <p className="font-display text-lg font-semibold tracking-[-0.03em] text-ink">{block.tier}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-mute">
              {block.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/docs" className="btn-primary">
          Docs
        </Link>
        <Link href="/examples" className="btn-secondary">
          Examples
        </Link>
      </div>
    </div>
  );
}
