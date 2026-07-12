"use client";

import { useEffect, useRef } from "react";

export interface HypoStep {
  iteration: number;
  hypothesis: string;
  confidence: string;
  citations: { doc: string; section?: string; quote?: string }[];
  nextAction?: { type: string; tool?: string; rationale?: string };
  fromTool?: string;
  final: boolean;
}

const CONF = {
  high: "var(--ds-brand)",
  medium: "var(--ds-text-muted)",
  low: "var(--ds-text-subtle)",
} as Record<string, string>;

export default function HypothesisTimeline({
  steps,
  running,
  finished,
}: {
  steps: HypoStep[];
  running: boolean;
  finished: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length]);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 py-4">
      <h2 className="eyebrow mb-4">Hypothesis Flow · reviewer view</h2>
      {steps.length === 0 && (
        <p className="text-xs text-ink-subtle">
          반복이 진행되며 각 iteration의 가설이 어떻게 진화하는지 여기에 쌓입니다.
        </p>
      )}

      <div className="flex flex-col">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          const active = s.final || (isLast && finished);
          const accent = active ? "var(--ds-brand)" : "var(--ds-text-subtle)";
          return (
            <div key={i} className="flex gap-3 pb-5">
              {/* rail: numbered node + connector */}
              <div className="flex flex-col items-center">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                  style={
                    active
                      ? { background: "var(--ds-brand)", color: "var(--ds-brand-fg)" }
                      : { background: "var(--ds-surface-2)", color: "var(--ds-text-muted)", boxShadow: "inset 0 0 0 1.5px var(--ds-border-strong)" }
                  }
                >
                  {s.iteration}
                </div>
                {(i < steps.length - 1 || running) && (
                  <div className="mt-1 w-px flex-1" style={{ background: "var(--ds-border)" }} />
                )}
              </div>

              {/* content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
                    Iteration {s.iteration}
                  </span>
                  {s.fromTool && (
                    <span className="font-mono text-[10px] text-ink-subtle">via {s.fromTool}</span>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                    style={{ color: CONF[s.confidence] ?? CONF.medium, background: "var(--ds-surface-2)" }}
                  >
                    {s.confidence}
                  </span>
                  {active && (
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
                      style={{ background: "var(--ds-brand-subtle)", color: "var(--ds-brand)" }}
                    >
                      ★ Final
                    </span>
                  )}
                </div>

                <p
                  className="font-serif text-[15px] leading-snug text-ink"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  {s.hypothesis}
                </p>

                {s.nextAction && (
                  <div className="mt-1.5 font-mono text-[11px]">
                    {s.nextAction.type === "stop" ? (
                      <span style={{ color: "var(--ds-brand)" }}>■ stop — recommendation issued</span>
                    ) : (
                      <span className="text-ink-muted">
                        → next: <span style={{ color: "var(--ds-brand)" }}>{s.nextAction.tool}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
