"use client";

import { useMemo, useState } from "react";
import { highlightCode, TOKEN_CLASS } from "@/lib/highlightCode";

export function CodeBlock({ code, label = "Python" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const tokens = useMemo(() => highlightCode(code, label), [code, label]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="code-panel overflow-hidden rounded-sm border border-ink/15 bg-[#0c1522] text-left">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5 text-[11px] text-mist/55">
        <span className="font-mono uppercase tracking-[0.14em]">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-sm px-2 py-1 font-medium tracking-wide text-signal-bright/90 transition hover:bg-white/8 hover:text-signal-bright"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-pre overflow-x-auto p-4 font-mono text-[12.5px] leading-[1.7] md:text-[13px]">
        <code>
          {tokens.map((t, idx) => (
            <span key={`${idx}-${t.kind}`} className={TOKEN_CLASS[t.kind]}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
