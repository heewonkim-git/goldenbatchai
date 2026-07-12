"use client";

import { useEffect, useRef } from "react";
import EvidenceCard from "./EvidenceCard";

export interface Message {
  agent: "analysis" | "msat" | "system";
  iteration: number;
  title: string;
  body?: string;
  tool?: string;
  evidence?: Record<string, unknown>;
}

const AGENT = {
  analysis: { icon: "🧮", label: "Analysis Agent", color: "var(--ds-accent-1)", bg: "var(--ds-accent-1-bg)" },
  msat: { icon: "🧠", label: "MSAT Agent", color: "var(--ds-accent-2)", bg: "var(--ds-accent-2-bg)" },
  system: { icon: "•", label: "System", color: "var(--ds-text-subtle)", bg: "var(--ds-surface-2)" },
} as const;

function Avatar({ icon, color, bg, dim }: { icon: string; color: string; bg: string; dim?: boolean }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
      style={{ background: bg, boxShadow: `inset 0 0 0 1.5px ${color}`, opacity: dim ? 0.6 : 1 }}
    >
      {icon}
    </div>
  );
}

export default function AgentConversation({
  messages,
  activity,
}: {
  messages: Message[];
  activity: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activity]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4">
      <h2 className="eyebrow mb-4">Agent Conversation · live work</h2>
      {messages.length === 0 && !activity && (
        <p className="text-xs text-ink-subtle">Run을 눌러 에이전트 반복을 시작하세요.</p>
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
          return (
            <div key={i} className="flex gap-3 pb-4">
              {/* rail: avatar + connector */}
              <div className="flex flex-col items-center">
                <Avatar icon={a.icon} color={a.color} bg={a.bg} />
                {!last && <div className="mt-1 w-px flex-1" style={{ background: "var(--ds-border)" }} />}
              </div>
              {/* content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-xs font-semibold" style={{ color: a.color }}>
                    {a.label}
                  </span>
                  {m.tool && <span className="font-mono text-[10px] text-ink-subtle">{m.tool}</span>}
                  {m.iteration > 0 && (
                    <span className="font-mono text-[10px] text-ink-subtle">· iter {m.iteration}</span>
                  )}
                </div>
                {hasEvidence ? (
                  <div
                    className="rounded-ds border-l-2 py-1 pl-3"
                    style={{ borderColor: a.color }}
                  >
                    <EvidenceCard tool={m.tool!} evidence={m.evidence as Record<string, unknown>} />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                    {m.title}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {activity && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: "var(--ds-accent-1-bg)" }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--ds-brand)" }} />
              </div>
            </div>
            <div className="pt-1.5 font-mono text-[11px] text-ink-muted">{activity}</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
