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
    <div className="code-panel overflow-hidden rounded-lg border border-ink/10 bg-ink text-left shadow-lg shadow-ink/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-mist/70">
        <span className="font-mono uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded px-2 py-1 font-medium text-signal-bright transition hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-pre overflow-x-auto p-4 font-mono text-[13px] leading-relaxed md:text-sm">
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
