"use client";

export interface Hypothesis {
  iteration: number;
  hypothesis: string;
  confidence: string;
  citations: { doc: string; section?: string }[];
  nextAction?: { type: string; tool?: string; rationale?: string };
}

export default function HypothesisPanel({ h }: { h: Hypothesis | null }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h2 className="eyebrow mb-3">Current Hypothesis</h2>
      {!h ? (
        <p className="text-xs text-ink-subtle">아직 가설이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          <p className="font-serif text-xl leading-snug text-ink" style={{ textWrap: "balance" }}>
            {h.hypothesis}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="badge"
              style={{ background: "var(--ds-accent-2-bg)", color: "var(--ds-accent-2)" }}
            >
              confidence · {h.confidence}
            </span>
            <span className="font-mono text-ink-subtle">iter {h.iteration}</span>
          </div>

          {h.citations.length > 0 && (
            <div>
              <div className="eyebrow mb-1.5">Citations</div>
              <ul className="space-y-1">
                {h.citations.map((c, i) => (
                  <li key={i} className="text-xs text-ink-muted">
                    📄 <span className="font-medium text-ink">{c.doc}</span>
                    {c.section ? <span className="font-mono text-ink-subtle"> · {c.section}</span> : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {h.nextAction && (
            <div className="rounded-ds border border-edge bg-surface-2 px-3 py-2 text-xs">
              <span className="eyebrow">Next</span>
              <div className="mt-1 text-ink">
                {h.nextAction.type === "stop" ? (
                  <span className="badge" style={{ background: "var(--ds-success-bg)", color: "var(--ds-success)" }}>stop</span>
                ) : (
                  <>
                    re_analysis → <span className="font-mono text-brand">{h.nextAction.tool ?? "?"}</span>
                  </>
                )}
              </div>
              {h.nextAction.rationale && (
                <div className="mt-1 text-ink-muted">{h.nextAction.rationale}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
