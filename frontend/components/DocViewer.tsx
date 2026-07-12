"use client";

import { useEffect, useRef } from "react";
import KB from "@/lib/kb-docs.json";

export interface Citation {
  doc: string;
  section?: string;
  quote?: string;
}

const DOCS = KB as Record<string, string>;

// tolerant lookup: exact title, else the doc whose title best overlaps the cite
function findDoc(name: string): [string, string] | null {
  if (DOCS[name]) return [name, DOCS[name]];
  const n = name.toLowerCase();
  let best: string | null = null;
  for (const key of Object.keys(DOCS)) {
    const k = key.toLowerCase();
    if (k.includes(n) || n.includes(k)) {
      if (!best || key.length < best.length) best = key;
    }
  }
  if (best) return [best, DOCS[best]];
  // fall back to first meaningful token overlap
  const tok = n.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  for (const key of Object.keys(DOCS)) {
    const kl = key.toLowerCase();
    if (tok.some((t) => kl.includes(t))) return [key, DOCS[key]];
  }
  return null;
}

function clean(s: string): string {
  return s.replace(/[`"'*]/g, "").replace(/\s+/g, " ").trim();
}

// locate the quote (or section heading) inside the doc → [before, match, after]
function locate(text: string, quote?: string, section?: string): [string, string, string] {
  const tryFind = (needle: string): number => {
    if (!needle) return -1;
    let i = text.indexOf(needle);
    if (i >= 0) return i;
    const c = clean(needle);
    i = text.toLowerCase().replace(/[`"'*]/g, " ").indexOf(c.toLowerCase());
    return i; // approximate; may be -1
  };

  if (quote) {
    const raw = quote.trim();
    let i = text.indexOf(raw);
    let len = raw.length;
    if (i < 0) {
      // try the longest clean fragment
      const frag = clean(raw).slice(0, 60);
      i = tryFind(frag);
      len = frag.length;
    }
    if (i >= 0) return [text.slice(0, i), text.slice(i, i + len), text.slice(i + len)];
  }
  if (section) {
    const i = text.indexOf(section);
    if (i >= 0) return [text.slice(0, i), text.slice(i, i + section.length), text.slice(i + section.length)];
  }
  return [text, "", ""];
}

export default function DocViewer({
  citation,
  onClose,
}: {
  citation: Citation | null;
  onClose: () => void;
}) {
  const markRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (citation) markRef.current?.scrollIntoView({ block: "center" });
  }, [citation]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!citation) return null;
  const found = findDoc(citation.doc);
  const title = found ? found[0] : citation.doc;
  const body = found ? found[1] : "(document not found)";
  const [before, match, after] = locate(body, citation.quote, citation.section);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-ds-lg border border-edge bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
          <span className="text-sm">📄</span>
          <span className="min-w-0 flex-1 truncate font-serif text-sm text-ink">{title}</span>
          {citation.section && (
            <span className="hidden font-mono text-[10px] text-ink-subtle sm:inline">
              {citation.section}
            </span>
          )}
          <button
            onClick={onClose}
            className="rounded px-2 py-0.5 text-ink-subtle hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-ink-muted">
            {before}
            {match && (
              <mark ref={markRef} style={{ background: "#c8fcf3", color: "#062a24" }}>
                {match}
              </mark>
            )}
            {after}
          </pre>
        </div>
      </div>
    </div>
  );
}
