"use client";

export interface Message {
  agent: "analysis" | "msat" | "system";
  iteration: number;
  title: string;
  body?: string;
}

const AGENT = {
  analysis: { cls: "b-analysis", icon: "🧮", label: "Analysis" },
  msat: { cls: "b-msat", icon: "🧠", label: "MSAT" },
  system: { cls: "b-system", icon: "•", label: "System" },
} as const;

export default function AgentConversation({ messages }: { messages: Message[] }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h2 className="eyebrow mb-3">Agent Conversation</h2>
      {messages.length === 0 && (
        <p className="text-xs text-ink-subtle">Run을 눌러 반복을 시작하세요.</p>
      )}
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => {
          const a = AGENT[m.agent];
          return (
            <div key={i} className={`bubble ${a.cls}`}>
              <div className="bubble-head">
                <span>{a.icon}</span>
                <span className="who">{a.label}</span>
                {m.iteration > 0 && <span className="meta">· iter {m.iteration}</span>}
              </div>
              <div className="font-medium text-ink">{m.title}</div>
              {m.body && <div className="bubble-body mt-0.5 font-mono">{m.body}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
