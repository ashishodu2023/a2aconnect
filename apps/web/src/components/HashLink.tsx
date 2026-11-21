"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Same-page and cross-page hash links that actually scroll (Next Link often skips #). */
export function HashLink({ href, className, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const hashIndex = href.indexOf("#");
    if (hashIndex < 0) return;

    const path = href.slice(0, hashIndex) || "/";
    const id = href.slice(hashIndex + 1);
    if (!id) return;

    const targetPath = path === "" ? "/" : path;
    const onTarget = pathname === targetPath || (targetPath === "/" && pathname === "/");

    if (onTarget) {
      event.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${id}`);
      }
      return;
    }

    event.preventDefault();
    router.push(href);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
