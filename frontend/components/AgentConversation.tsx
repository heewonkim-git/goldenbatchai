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
  analysis: { cls: "b-analysis", icon: "🧮", label: "Analysis" },
  msat: { cls: "b-msat", icon: "🧠", label: "MSAT" },
  system: { cls: "b-system", icon: "•", label: "System" },
} as const;

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
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h2 className="eyebrow mb-3">Agent Conversation</h2>
      {messages.length === 0 && !activity && (
        <p className="text-xs text-ink-subtle">Run을 눌러 반복을 시작하세요.</p>
      )}
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => {
          const a = AGENT[m.agent];
          const hasEvidence = m.agent === "analysis" && m.tool && m.evidence;
          return (
            <div key={i} className={`bubble ${a.cls}`}>
              <div className="bubble-head">
                <span>{a.icon}</span>
                <span className="who">{a.label}</span>
                {m.tool && <span className="meta font-mono">· {m.tool}</span>}
                {m.iteration > 0 && <span className="meta">· iter {m.iteration}</span>}
              </div>
              {hasEvidence ? (
                <EvidenceCard tool={m.tool!} evidence={m.evidence as Record<string, unknown>} />
              ) : (
                <>
                  <div className="font-medium text-ink">{m.title}</div>
                  {m.body && <div className="bubble-body mt-0.5">{m.body}</div>}
                </>
              )}
            </div>
          );
        })}

        {activity && (
          <div className="flex items-center gap-2 px-1 py-1 text-xs text-ink-muted">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" />
            <span className="font-mono">{activity}</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
