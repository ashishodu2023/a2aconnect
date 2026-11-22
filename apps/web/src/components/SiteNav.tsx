import Link from "next/link";
import { HashLink } from "@/components/HashLink";

const links = [
  { href: "/#how-it-fits", label: "Product" },
  { href: "/architecture", label: "Architecture" },
  { href: "/examples", label: "Examples" },
  { href: "/docs", label: "Docs" },
  { href: "/roadmap", label: "Roadmap" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/8 bg-[#f7f8fa]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link
          href="/"
          className="font-display text-[1.05rem] font-semibold tracking-[-0.04em] text-ink md:text-lg"
        >
          A2AConnect
        </Link>
        <nav className="hidden items-center gap-7 text-[0.8125rem] font-medium text-ink-mute md:flex">
          {links.map((l) =>
            l.href.includes("#") ? (
              <HashLink
                key={l.href}
                href={l.href}
                className="tracking-[-0.01em] transition-colors hover:text-ink"
              >
                {l.label}
              </HashLink>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="tracking-[-0.01em] transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <HashLink href="/#quickstart" className="btn-primary !px-3.5 !py-2 text-[0.8125rem]">
          Get started
        </HashLink>
      </div>
    </header>
  );
}
