import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { HashLink } from "@/components/HashLink";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "A2AConnect documentation — getting started, architecture, Python API, adapters, transports, policy, and interop SPEC.",
  alternates: { canonical: "/docs" },
};

const guides = [
  {
    href: "/#quickstart",
    title: "Getting started",
    detail: "Install the package and run your first agent→agent handoff.",
    hash: true,
  },
  {
    href: "/architecture",
    title: "Architecture",
    detail: "System map, lifecycle, envelopes, transports, LF A2A & MCP.",
    hash: false,
  },
  {
    href: "/examples",
    title: "Executable examples",
    detail: "Support desk, incident handoff, cross-runtime brief, quickstart.",
    hash: false,
  },
];

const repoDocs = [
  { path: "docs/getting-started.md", title: "Getting started (repo)" },
  { path: "docs/gateway.md", title: "Gateway preview" },
  { path: "docs/bridge-lf-a2a.md", title: "LF A2A bridge" },
  { path: "ROADMAP.md", title: "Roadmap" },
  { path: "docs/python-api.md", title: "Python API" },
  { path: "docs/adapters.md", title: "Adapters" },
  { path: "docs/transports.md", title: "Transports" },
  { path: "docs/policy-audit.md", title: "Policy & audit" },
  { path: "protocol/SPEC.md", title: "Interop SPEC v1.0" },
  { path: "docs/architecture.md", title: "Architecture (repo)" },
  { path: "demos/README.md", title: "Demos index" },
  { path: "CONTRIBUTING.md", title: "Contributing" },
  { path: "CHANGELOG.md", title: "Changelog" },
];

const apiSketch = `from a2aconnect import (
    AgentPeer,
    MemoryAuditLog,
    create_bus,
    from_async_fn,
    create_graph_style_adapter,
    create_crew_style_adapter,
    with_outbound_buffer,
)

bus = create_bus()
audit = MemoryAuditLog()
# handlers={"research.web": from_async_fn(run)}
# peer.start(); await peer.hello(...); await peer.offer_task(...)`;

export default function DocsPage() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-ink/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 360px at 15% -10%, rgba(36,196,173,0.16), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-signal-dim">Documentation</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold text-ink md:text-5xl">
            Guides, API, and the interop profile
          </h1>
          <p className="mt-4 max-w-2xl text-ink-mute md:text-lg">
            Product pages on this site plus the full markdown docs in the repository. Start with a runnable
            demo, then dig into the SPEC and Python API.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-14">
        <h2 className="font-display text-2xl font-bold text-ink">On this site</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {guides.map((g) =>
            g.hash ? (
              <HashLink
                key={g.title}
                href={g.href}
                className="block rounded-xl border border-ink/10 bg-white/60 px-4 py-4 transition hover:border-signal/40"
              >
                <p className="font-display font-semibold text-ink">{g.title}</p>
                <p className="mt-2 text-sm text-ink-mute">{g.detail}</p>
              </HashLink>
            ) : (
              <Link
                key={g.title}
                href={g.href}
                className="block rounded-xl border border-ink/10 bg-white/60 px-4 py-4 transition hover:border-signal/40"
              >
                <p className="font-display font-semibold text-ink">{g.title}</p>
                <p className="mt-2 text-sm text-ink-mute">{g.detail}</p>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="border-y border-ink/5 bg-white/35">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 md:px-8 md:py-14">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">In the repository</h2>
            <p className="mt-3 text-sm text-ink-mute">
              After you unzip or clone the project, these paths are the canonical written docs.
            </p>
            <ul className="mt-6 space-y-2">
              {repoDocs.map((d) => (
                <li key={d.path} className="flex flex-wrap items-baseline gap-2 border-b border-ink/5 pb-2">
                  <span className="font-medium text-ink">{d.title}</span>
                  <code className="font-mono text-[11px] text-signal-dim">{d.path}</code>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">API at a glance</h2>
            <p className="mt-3 text-sm text-ink-mute">
              Full reference: <code className="font-mono text-xs">docs/python-api.md</code>
            </p>
            <div className="mt-6">
              <CodeBlock code={apiSketch} label="Python" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-12 md:px-8">
        <div className="flex flex-wrap gap-3">
          <HashLink
            href="/#quickstart"
            className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dim"
          >
            Get started
          </HashLink>
          <Link
            href="/examples"
            className="rounded-md border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal/40"
          >
            Run examples
          </Link>
        </div>
      </section>
    </div>
  );
}
