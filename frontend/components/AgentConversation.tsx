"use client";

import { useEffect, useRef, useState } from "react";
import EvidenceCard from "./EvidenceCard";
import DocViewer, { Citation } from "./DocViewer";
import { Lang, tr } from "@/lib/i18n";

export interface Message {
  agent: "analysis" | "msat" | "system";
  iteration: number;
  title: string;
  title_ko?: string;
  body?: string;
  tool?: string;
  evidence?: Record<string, unknown>;
  citations?: Citation[];
}

const AGENT = {
  analysis: { icon: "🧮", label: "Analysis Agent", color: "var(--ds-accent-1)", bg: "var(--ds-accent-1-bg)" },
  msat: { icon: "🧠", label: "MSAT Agent", color: "var(--ds-accent-2)", bg: "var(--ds-accent-2-bg)" },
  system: { icon: "•", label: "System", color: "var(--ds-text-subtle)", bg: "var(--ds-surface-2)" },
} as const;

function Avatar({ icon, color, bg }: { icon: string; color: string; bg: string }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
      style={{ background: bg, boxShadow: `inset 0 0 0 1.5px ${color}` }}
    >
      {icon}
    </div>
  );
}

function shortDoc(doc: string): string {
  return doc.split(/[—:(]/)[0].trim();
}

// render interpretation text with clickable [n] citation markers
function InterpretationText({
  text,
  citations,
  onOpen,
}: {
  text: string;
  citations: Citation[];
  onOpen: (c: Citation) => void;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="text-[13px] leading-relaxed text-ink-muted">
      {parts.map((part, k) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = parseInt(m[1], 10);
          const cit = citations[n - 1];
          return (
            <sup
              key={k}
              onClick={() => cit && onOpen(cit)}
              className="mx-[1px] cursor-pointer rounded px-[3px] font-mono text-[10px] font-semibold"
              style={{ color: "var(--ds-brand)", background: "var(--ds-accent-1-bg)" }}
              title={cit ? cit.doc : undefined}
            >
              {n}
            </sup>
          );
        }
        return <span key={k}>{part}</span>;
      })}
    </p>
  );
}

export default function AgentConversation({
  messages,
  activity,
  lang,
}: {
  messages: Message[];
  activity: string | null;
  lang: Lang;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Citation | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activity]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4">
      <h2 className="eyebrow mb-4">{tr(lang, "conv_title")}</h2>
      {messages.length === 0 && !activity && (
        <p className="text-xs text-ink-subtle">{tr(lang, "conv_empty")}</p>
      )}

      <div className="flex flex-col">
        {messages.map((m, i) => {
          const a = AGENT[m.agent];
          const last = i === messages.length - 1 && !activity;

          if (m.agent === "system") {
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 pl-9 text-[11px] text-ink-subtle">
                <span className="h-px w-4 bg-edge" />
                <span className="font-mono">{m.title}</span>
              </div>
            );
          }

          const hasEvidence = m.agent === "analysis" && m.tool && m.evidence;
          const cites = m.citations ?? [];
          return (
            <div key={i} className="flex gap-3 pb-4">
              <div className="flex flex-col items-center">
                <Avatar icon={a.icon} color={a.color} bg={a.bg} />
                {!last && <div className="mt-1 w-px flex-1" style={{ background: "var(--ds-border)" }} />}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                  {m.tool && <span className="font-mono text-[10px] text-ink-subtle">{m.tool}</span>}
                  {m.iteration > 0 && (
                    <span className="font-mono text-[10px] text-ink-subtle">· iter {m.iteration}</span>
                  )}
                </div>

                {hasEvidence ? (
                  <div className="rounded-ds border-l-2 py-1 pl-3" style={{ borderColor: a.color }}>
                    <EvidenceCard tool={m.tool!} evidence={m.evidence as Record<string, unknown>} />
                  </div>
                ) : (
                  <>
                    <InterpretationText
                      text={lang === "ko" ? m.title_ko || m.title : m.title}
                      citations={cites}
                      onOpen={setViewer}
                    />
                    {cites.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
                          {tr(lang, "reference")}
                        </span>
                        {cites.map((c, n) => (
                          <button
                            key={n}
                            onClick={() => setViewer(c)}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] hover:opacity-80"
                            style={{ background: "var(--ds-accent-1-bg)", color: "var(--ds-brand)" }}
                            title={c.section}
                          >
                            <span className="font-mono font-semibold">[{n + 1}]</span>
                            <span>{shortDoc(c.doc)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {activity && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--ds-accent-1-bg)" }}>
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--ds-brand)" }} />
              </div>
            </div>
            <div className="pt-1.5 font-mono text-[11px] text-ink-muted">{activity}</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <DocViewer citation={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
