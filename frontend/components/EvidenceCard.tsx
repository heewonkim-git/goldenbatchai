"use client";

// Renders Analysis Agent evidence as compact charts (SHAP bars, group tests,
// leaderboards) instead of raw JSON. One switch per tool. Quantitative only —
// interpretation is the MSAT Agent's job.

type Ev = Record<string, any>;

const A1 = "var(--ds-accent-1)";
const OK = "var(--ds-success)";
const BAD = "var(--ds-danger)";
const MUTED = "var(--ds-text-subtle)";

function shortFeat(f: string) {
  return f; // full name shown; CSS truncates with a title tooltip
}

function Bar({ frac, color = A1 }: { frac: number; color?: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(2, Math.min(100, frac * 100))}%`, background: color }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-[150px] shrink-0 truncate font-mono text-[11px] text-ink"
        title={label}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-mono text-[11px] text-ink-subtle">{children}</div>;
}

/* ---- per-tool renderers -------------------------------------------------- */

function ShapView({ ev }: { ev: Ev }) {
  const feats = (ev.top_features ?? []).slice(0, 8);
  const max = Math.max(...feats.map((f: Ev) => f.mean_abs_shap), 1e-9);
  return (
    <div>
      <Caption>
        SHAP · {ev.model} · {ev.n_samples} batches · base {ev.base_value}
      </Caption>
      <div className="flex flex-col gap-1.5">
        {feats.map((f: Ev, i: number) => (
          <Row key={i} label={shortFeat(f.feature)}>
            <span
              className="w-3 shrink-0 text-center text-[11px]"
              style={{ color: f.direction === "positive" ? OK : BAD }}
              title={f.direction}
            >
              {f.direction === "positive" ? "▲" : "▼"}
            </span>
            <Bar frac={f.mean_abs_shap / max} />
            <span className="w-11 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-muted">
              {f.mean_abs_shap.toFixed(3)}
            </span>
          </Row>
        ))}
      </div>
    </div>
  );
}

function FeatureSelView({ ev }: { ev: Ev }) {
  const agg = (ev.aggregated_rank ?? []).slice(0, 8);
  const max = Math.max(...agg.map((f: Ev) => f.score), 1e-9);
  const nMethods = (ev.methods ?? []).length || 4;
  return (
    <div>
      <Caption>
        Ensemble rank · {ev.num_selected} selected · {nMethods} methods (SHAP·LGB·Lasso·MI)
      </Caption>
      <div className="flex flex-col gap-1.5">
        {agg.map((f: Ev, i: number) => (
          <Row key={i} label={shortFeat(f.feature)}>
            <Bar frac={f.score / max} />
            <span
              className="w-9 shrink-0 rounded-full text-center font-mono text-[10px] tabular-nums"
              style={{ background: "var(--ds-accent-1-bg)", color: A1 }}
              title="methods that selected this feature"
            >
              {f.methods_hit}/{nMethods}
            </span>
          </Row>
        ))}
      </div>
    </div>
  );
}

function Leaderboard({ ev }: { ev: Ev }) {
  const board = ev.leaderboard ?? ev.models ?? [];
  const best = ev.best_model ?? board[0]?.model;
  return (
    <div>
      <Caption>
        {ev.framework ? `AutoML · ${ev.framework}` : "Model comparison"} ·{" "}
        {ev.n_features_in ? `${ev.n_features_in} features · ` : ""}
        {ev.n_samples} batches
      </Caption>
      <div className="overflow-hidden rounded-ds border border-edge">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-surface-2 font-mono uppercase tracking-wide text-ink-subtle">
              <th className="px-2 py-1 text-left font-medium">Model</th>
              <th className="px-2 py-1 text-right font-medium">RMSE ↓</th>
              <th className="px-2 py-1 text-right font-medium">R²</th>
            </tr>
          </thead>
          <tbody>
            {board.map((m: Ev, i: number) => (
              <tr
                key={i}
                className="border-t border-edge"
                style={m.model === best ? { background: "var(--ds-accent-1-bg)" } : undefined}
              >
                <td className="px-2 py-1 font-mono text-ink">
                  {m.model === best && <span style={{ color: A1 }}>★ </span>}
                  {m.model}
                </td>
                <td className="px-2 py-1 text-right font-mono tabular-nums text-ink-muted">
                  {m.rmse?.toFixed(2)}
                </td>
                <td className="px-2 py-1 text-right font-mono tabular-nums text-ink-muted">
                  {m.r2?.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTestView({ ev }: { ev: Ev }) {
  const g = ev.groups ?? {};
  const hi = g.high ?? {};
  const lo = g.low ?? {};
  const max = Math.max(hi.mean ?? 0, lo.mean ?? 0, 1e-9);
  const sig = ev.p_value != null && ev.p_value < 0.05;
  return (
    <div>
      <Caption>
        {ev.test} · {ev.group_rule}
      </Caption>
      <div className="mb-2 flex flex-col gap-1.5">
        <Row label={`high  (n=${hi.n ?? "?"})`}>
          <Bar frac={(hi.mean ?? 0) / max} />
          <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-muted">
            {hi.mean?.toFixed(1)}
          </span>
        </Row>
        <Row label={`low  (n=${lo.n ?? "?"})`}>
          <Bar frac={(lo.mean ?? 0) / max} color={MUTED} />
          <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-muted">
            {lo.mean?.toFixed(1)}
          </span>
        </Row>
      </div>
      <span
        className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px]"
        style={{
          background: sig ? "var(--ds-success-bg)" : "var(--ds-warning-bg)",
          color: sig ? OK : "var(--ds-warning)",
        }}
      >
        p = {ev.p_value} {sig ? "· significant" : "· n.s."}
      </span>
    </div>
  );
}

function CorrelationView({ ev }: { ev: Ev }) {
  const rows = (ev.correlations ?? []).slice(0, 8);
  const max = Math.max(...rows.map((r: Ev) => Math.abs(r.r)), 1e-9);
  return (
    <div>
      <Caption>
        {ev.method} correlation with target · {ev.n_samples} batches
      </Caption>
      <div className="flex flex-col gap-1.5">
        {rows.map((r: Ev, i: number) => {
          const sig = r.p_value != null && r.p_value < 0.05;
          return (
            <Row key={i} label={shortFeat(r.feature)}>
              <Bar frac={Math.abs(r.r) / max} color={r.r >= 0 ? A1 : BAD} />
              <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-muted">
                {r.r >= 0 ? "+" : ""}
                {r.r.toFixed(2)}
                {sig ? "*" : ""}
              </span>
            </Row>
          );
        })}
      </div>
    </div>
  );
}

function CollinearityView({ ev }: { ev: Ev }) {
  const dropped = ev.dropped ?? [];
  return (
    <div>
      <Caption>
        Spearman |ρ| &gt; {ev.threshold} · dropped {ev.n_dropped} · kept {ev.n_remaining}
      </Caption>
      <div className="flex flex-wrap gap-1">
        {dropped.length === 0 && (
          <span className="text-[11px] text-ink-subtle">no redundant features</span>
        )}
        {dropped.map((f: string, i: number) => (
          <span
            key={i}
            className="truncate rounded-full px-2 py-0.5 font-mono text-[10px]"
            style={{ background: "var(--ds-danger-bg)", color: BAD, maxWidth: "100%" }}
            title={f}
          >
            − {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EvidenceCard({ tool, evidence }: { tool: string; evidence: Ev }) {
  if (!evidence || evidence.stub) {
    return <div className="font-mono text-[11px] text-ink-subtle">{tool} (no evidence)</div>;
  }
  switch (tool) {
    case "shap_analysis":
      return <ShapView ev={evidence} />;
    case "feature_selection":
      return <FeatureSelView ev={evidence} />;
    case "automl":
    case "model_compare":
      return <Leaderboard ev={evidence} />;
    case "statistical_test":
      return <StatTestView ev={evidence} />;
    case "correlation_analysis":
      return <CorrelationView ev={evidence} />;
    case "remove_multicollinearity":
      return <CollinearityView ev={evidence} />;
    default:
      return (
        <pre className="overflow-x-auto font-mono text-[10px] text-ink-muted">
          {JSON.stringify(evidence, null, 1)}
        </pre>
      );
  }
}
