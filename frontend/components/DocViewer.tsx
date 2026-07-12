"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/eventStream";

export interface Citation {
  doc: string;
  doc_id?: string;
  section?: string;
  quote?: string;
}

interface Block {
  type: string; // heading1|heading2|heading3|para|bullet|meta|table
  text: string;
  rows: string[][];
}
interface KbDoc {
  id: string;
  title: string;
  version: number;
  blocks: Block[];
}

const norm = (s: string) => s.replace(/[`"'*]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

// where does the cited quote live? returns block index + optional char range / table row
function findMatch(blocks: Block[], quote?: string, section?: string) {
  const q = quote ? norm(quote) : "";
  if (q) {
    // try progressively shorter fragments so near-quotes still land
    const frags = [q, q.slice(0, 80), q.slice(0, 40)].filter((f, i, a) => f && a.indexOf(f) === i);
    for (const frag of frags) {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type === "table") {
          for (let r = 0; r < b.rows.length; r++) {
            if (norm(b.rows[r].join(" ")).includes(frag)) return { block: i, row: r };
          }
        } else if (norm(b.text).includes(frag)) {
          return { block: i, frag };
        }
      }
    }
  }
  if (section) {
    const s = norm(section);
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type.startsWith("heading") && norm(blocks[i].text).includes(s)) return { block: i };
    }
  }
  return null;
}

// split a block's text around the matched fragment for inline highlighting
function highlightText(text: string, frag?: string): [string, string, string] {
  if (!frag) return [text, "", ""];
  const idx = norm(text).indexOf(frag);
  if (idx < 0) return [text, "", ""];
  // map normalized index back to raw text approximately by walking words
  const raw = text;
  const lower = raw.toLowerCase();
  // find a raw offset: search the first ~12 chars of the fragment in the raw lowercased text
  const probe = frag.slice(0, 16).replace(/\s+/g, " ");
  let start = lower.replace(/[`"'*]/g, " ").indexOf(probe.split(" ")[0]);
  if (start < 0) start = 0;
  const len = Math.min(raw.length - start, Math.max(frag.length, 12));
  return [raw.slice(0, start), raw.slice(start, start + len), raw.slice(start + len)];
}

export default function DocViewer({
  citation,
  onClose,
}: {
  citation: Citation | null;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<KbDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!citation) return;
    setDoc(null);
    setError(null);
    setLoading(true);
    const id = citation.doc_id;
    const load = async () => {
      try {
        let docId = id;
        if (!docId) {
          const list = (await (await fetch(`${API_BASE}/api/kb`)).json()).documents as KbDoc[];
          const n = norm(citation.doc);
          const hit = list.find(
            (d) => norm(d.title).includes(n) || n.includes(norm(d.title)) || d.id === citation.doc,
          );
          docId = hit?.id;
        }
        if (!docId) throw new Error("문서를 찾을 수 없습니다");
        const r = await fetch(`${API_BASE}/api/kb/${encodeURIComponent(docId)}`);
        if (!r.ok) throw new Error(`문서 로드 실패 (${r.status})`);
        setDoc((await r.json()) as KbDoc);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [citation]);

  useEffect(() => {
    if (doc) setTimeout(() => markRef.current?.scrollIntoView({ block: "center" }), 50);
  }, [doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!citation) return null;
  const match = doc ? findMatch(doc.blocks, citation.quote, citation.section) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-ds-lg border border-edge bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Word-style title bar */}
        <div className="flex items-center gap-2 border-b border-edge bg-surface-2 px-4 py-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#2b579a] text-[11px] font-bold text-white">
            W
          </span>
          <span className="min-w-0 flex-1 truncate font-serif text-sm text-ink">
            {doc?.title ?? citation.doc}
            {doc && <span className="ml-1 font-mono text-[10px] text-ink-subtle">.docx</span>}
          </span>
          {doc && (
            <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-subtle ring-1 ring-edge">
              v{doc.version}
            </span>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-ds text-ink-subtle hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Word "page" */}
        <div className="overflow-y-auto bg-[#e7e7e9] px-6 py-6 dark:bg-[#1a1a1c]">
          {loading && <p className="text-center text-xs text-ink-subtle">문서 불러오는 중…</p>}
          {error && <p className="text-center text-xs text-red-500">⚠️ {error}</p>}
          {doc && (
            <article
              className="mx-auto max-w-[680px] bg-white px-12 py-12 text-[#1a1a1a] shadow-md"
              style={{ fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}
            >
              {doc.blocks.map((b, i) => {
                const hit = match?.block === i;
                const key = `b${i}`;
                if (b.type === "heading1")
                  return (
                    <h1 key={key} ref={hit ? markRef : undefined}
                      className="mb-3 mt-1 font-serif text-[22px] font-semibold text-[#1f3864]">
                      {b.text}
                    </h1>
                  );
                if (b.type === "heading2")
                  return (
                    <h2 key={key} ref={hit ? markRef : undefined}
                      className="mb-2 mt-5 border-b border-[#2b579a]/25 pb-1 font-serif text-[16px] font-semibold text-[#2b579a]">
                      {b.text}
                    </h2>
                  );
                if (b.type === "heading3")
                  return (
                    <h3 key={key} ref={hit ? markRef : undefined}
                      className="mb-1 mt-4 font-serif text-[14px] font-semibold text-[#2b579a]">
                      {b.text}
                    </h3>
                  );
                if (b.type === "meta")
                  return (
                    <p key={key} className="mb-4 text-[11px] italic text-[#6b6b6b]">{b.text}</p>
                  );
                if (b.type === "bullet") {
                  const [pre, mid, post] = hit ? highlightText(b.text, match?.frag) : [b.text, "", ""];
                  return (
                    <div key={key} ref={hit ? markRef : undefined} className="mb-1 flex gap-2 pl-2 text-[13px] leading-relaxed">
                      <span className="text-[#2b579a]">•</span>
                      <span>{pre}{mid && <mark style={{ background: "#c8fcf3", color: "#062a24" }}>{mid}</mark>}{post}</span>
                    </div>
                  );
                }
                if (b.type === "table")
                  return (
                    <div key={key} ref={hit ? markRef : undefined} className="my-3 overflow-x-auto">
                      <table className="w-full border-collapse text-[11.5px]">
                        <tbody>
                          {b.rows.map((row, r) => {
                            const isHeader = r === 0;
                            const rowHit = match?.block === i && match?.row === r;
                            return (
                              <tr key={r} style={rowHit ? { background: "#c8fcf3" } : undefined}>
                                {row.map((cell, c) => {
                                  const Tag = isHeader ? "th" : "td";
                                  return (
                                    <Tag key={c}
                                      className="border border-[#bfbfbf] px-2 py-1 text-left align-top"
                                      style={{
                                        background: isHeader ? "#2b579a" : rowHit ? "#c8fcf3" : undefined,
                                        color: isHeader ? "#fff" : rowHit ? "#062a24" : undefined,
                                        fontWeight: isHeader ? 600 : 400,
                                      }}>
                                      {cell}
                                    </Tag>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                // para
                const [pre, mid, post] = hit ? highlightText(b.text, match?.frag) : [b.text, "", ""];
                return (
                  <p key={key} ref={hit ? markRef : undefined} className="mb-2 text-[13px] leading-relaxed">
                    {pre}
                    {mid && <mark style={{ background: "#c8fcf3", color: "#062a24" }}>{mid}</mark>}
                    {post}
                  </p>
                );
              })}
            </article>
          )}
        </div>

        {citation.section && (
          <div className="border-t border-edge bg-surface px-4 py-1.5 font-mono text-[10px] text-ink-subtle">
            cited section: {citation.section}
          </div>
        )}
      </div>
    </div>
  );
}
