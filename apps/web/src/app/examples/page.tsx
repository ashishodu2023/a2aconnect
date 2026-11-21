import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { HashLink } from "@/components/HashLink";
import { demoExamples, demosInstall } from "@/content/demoSources";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Executable agent-to-agent A2AConnect demos — support desk, incident handoff, cross-runtime brief, and quickstart.",
  alternates: { canonical: "/examples" },
};

export default function ExamplesPage() {
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-ink/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 360px at 0% 0%, rgba(36,196,173,0.16), transparent 55%), radial-gradient(600px 300px at 100% 10%, rgba(232,145,58,0.12), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-signal-dim">Examples</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold text-ink md:text-5xl">
            Real agent → agent examples you can run
          </h1>
          <p className="mt-4 max-w-2xl text-ink-mute md:text-lg">
            Four executable demos. No API keys. Each starts multiple{" "}
            <code className="font-mono text-sm text-signal-dim">AgentPeer</code> instances, handshakes,
            offers tasks, streams progress, and prints an audit trail.
          </p>
          <div className="mt-8 max-w-2xl">
            <CodeBlock code={demosInstall} label="shell — run all" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-5 py-14 md:px-8 md:py-16">
        {demoExamples.map((demo, index) => (
          <article
            key={demo.id}
            id={demo.id}
            className="scroll-mt-24 border-b border-ink/10 pb-16 last:border-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.14em] text-ember">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">{demo.title}</h2>
            </div>
            <p className="mt-1 font-mono text-sm text-signal-dim">{demo.subtitle}</p>
            <p className="mt-3 max-w-2xl text-ink-mute">{demo.blurb}</p>
            <p className="mt-3 font-mono text-[11px] tracking-wide text-ink-soft">
              {demo.tags.join(" · ")}
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
              <div>
                <CodeBlock code={demo.command} label="run" />
                <p className="mt-3 text-sm text-ink-mute">
                  Full source:{" "}
                  <code className="font-mono text-xs text-ink">demos/{demo.file}</code>
                </p>
                <ol className="mt-5 space-y-2 text-sm text-ink-mute">
                  <li>
                    <span className="font-semibold text-ink">1.</span> Agents start on a shared in-memory
                    bus
                  </li>
                  <li>
                    <span className="font-semibold text-ink">2.</span> Orchestrator{" "}
                    <code className="font-mono text-xs">hello</code>s each peer
                  </li>
                  <li>
                    <span className="font-semibold text-ink">3.</span>{" "}
                    <code className="font-mono text-xs">offer_task</code> chains results agent → agent
                  </li>
                  <li>
                    <span className="font-semibold text-ink">4.</span> Audit log prints the lifecycle
                  </li>
                </ol>
              </div>
              <CodeBlock code={demo.code} label={`demos/${demo.file}`} />
            </div>
          </article>
        ))}
      </div>

      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/architecture"
            className="rounded-md border border-ink/15 bg-white/50 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-signal/40"
          >
            Architecture
          </Link>
          <HashLink
            href="/#quickstart"
            className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal-dim"
          >
            Get started
          </HashLink>
        </div>
      </section>
    </div>
  );
}
