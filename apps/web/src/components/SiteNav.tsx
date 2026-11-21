import Link from "next/link";
import { HashLink } from "@/components/HashLink";

const links = [
  { href: "/#how-it-fits", label: "How it fits" },
  { href: "/architecture", label: "Architecture" },
  { href: "/examples", label: "Examples" },
  { href: "/docs", label: "Docs" },
  { href: "/#quickstart", label: "Quickstart" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-mist/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink md:text-xl">
          A2AConnect
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          {links.map((l) =>
            l.href.includes("#") ? (
              <HashLink key={l.href} href={l.href} className="transition hover:text-signal-dim">
                {l.label}
              </HashLink>
            ) : (
              <Link key={l.href} href={l.href} className="transition hover:text-signal-dim">
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <HashLink
          href="/#quickstart"
          className="rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-mist transition hover:bg-ink-soft"
        >
          Get started
        </HashLink>
      </div>
    </header>
  );
}
