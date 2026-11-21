import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="font-display text-lg font-bold">A2AConnect</p>
          <p className="mt-1 max-w-md text-sm text-mist/70">
            Python interop runtime + Node.js site. LF A2A–compatible. Complements MCP.
          </p>
          <a href="https://a2aconnect.dev" className="mt-2 inline-block font-mono text-xs text-signal-bright hover:underline">
            a2aconnect.dev
          </a>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-mist/80">
          <Link href="/architecture" className="hover:text-signal-bright">Architecture</Link>
          <Link href="/examples" className="hover:text-signal-bright">Examples</Link>
          <Link href="/docs" className="hover:text-signal-bright">Docs</Link>
          <a href="https://a2a-protocol.org" className="hover:text-signal-bright" rel="noreferrer">LF A2A</a>
        </div>
      </div>
    </footer>
  );
}
