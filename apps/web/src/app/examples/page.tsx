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
      <section className="relative overflow-hidden border-b border-ink/8">
        <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <p className="section-label">Examples</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-[-0.04em] text-ink md:text-[2.75rem]">
            Real agent → agent examples you can run
          </h1>
          <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink-mute">
            Executable demos. No API keys. Each starts multiple{" "}
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
              <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-ink md:text-[1.75rem]">{demo.title}</h2>
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
          <Link href="/architecture" className="btn-secondary">
            Architecture
          </Link>
          <HashLink href="/#quickstart" className="btn-primary">
            Get started
          </HashLink>
        </div>
      </section>
    </div>
  );
}
