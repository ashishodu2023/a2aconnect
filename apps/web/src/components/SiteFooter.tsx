import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink text-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr] md:px-8 md:py-16">
        <div>
          <p className="font-display text-xl font-semibold tracking-[-0.04em]">A2AConnect</p>
          <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-mist/65">
            SDK-agnostic interop for mixed-runtime agent fleets. LF A2A–compatible. Complements MCP.
          </p>
          <a
            href="https://a2aconnect.dev"
            className="mt-4 inline-block font-mono text-xs tracking-wide text-signal-bright/90 transition hover:text-signal-bright"
          >
            a2aconnect.dev
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist/45">Product</p>
            <div className="mt-3 flex flex-col gap-2.5 text-mist/75">
              <Link href="/architecture" className="transition hover:text-white">
                Architecture
              </Link>
              <Link href="/examples" className="transition hover:text-white">
                Examples
              </Link>
              <Link href="/docs" className="transition hover:text-white">
                Documentation
              </Link>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist/45">Standards</p>
            <div className="mt-3 flex flex-col gap-2.5 text-mist/75">
              <a
                href="https://a2a-protocol.org"
                className="transition hover:text-white"
                rel="noreferrer"
              >
                Linux Foundation A2A
              </a>
              <a
                href="https://modelcontextprotocol.io"
                className="transition hover:text-white"
                rel="noreferrer"
              >
                MCP
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-mist/45 md:flex-row md:items-center md:justify-between md:px-8">
          <span>Open-core interop runtime</span>
          <span className="font-mono tracking-wide">Python · Node.js site</span>
        </div>
      </div>
    </footer>
  );
}
