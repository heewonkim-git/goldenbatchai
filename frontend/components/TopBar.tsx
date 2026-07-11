"use client";

type ThemeMode = "system" | "light" | "dark";

interface Props {
  target: string;
  setTarget: (v: string) => void;
  framework: string;
  setFramework: (v: string) => void;
  maxIter: number;
  setMaxIter: (v: number) => void;
  running: boolean;
  onRun: () => void;
  health: Record<string, unknown> | null;
  theme: ThemeMode;
  onCycleTheme: () => void;
}

const TARGETS = ["[harvest][Harvest] Product. Yield", "DSP_Final_Protein (g)"];
const THEME_ICON: Record<ThemeMode, string> = { system: "◐", light: "☀", dark: "☾" };

export default function TopBar({
  target,
  setTarget,
  framework,
  setFramework,
  maxIter,
  setMaxIter,
  running,
  onRun,
  health,
  theme,
  onCycleTheme,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-edge bg-surface px-4 py-3">
      <span className="mr-1 font-mono text-xs uppercase tracking-wider text-ink-muted">
        Golden Batch · <span className="font-semibold text-brand">Multi-Agent</span>
      </span>

      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
        <input type="checkbox" defaultChecked disabled className="accent-[color:var(--ds-brand)]" />
        Demo dataset
      </label>

      <select
        className="field-input max-w-[260px]"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={running}
      >
        {TARGETS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        className="field-input"
        value={framework}
        onChange={(e) => setFramework(e.target.value)}
        disabled={running}
      >
        <option value="autogluon">AutoGluon</option>
        <option value="h2o">H2O AutoML</option>
      </select>

      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
        Max iter
        <input
          type="number"
          min={1}
          max={10}
          className="field-input w-14"
          value={maxIter}
          onChange={(e) => setMaxIter(Number(e.target.value))}
          disabled={running}
        />
      </label>

      <button onClick={onRun} disabled={running} className="btn btn-primary">
        {running ? "Running…" : "Run"}
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-[11px] text-ink-subtle">
          backend{" "}
          {health ? (
            <span className="text-[color:var(--ds-success)]">ok</span>
          ) : (
            <span className="text-[color:var(--ds-danger)]">offline</span>
          )}
          {health && !health.has_api_key ? " · stub" : ""}
        </span>
        <button
          onClick={onCycleTheme}
          className="flex items-center gap-1.5 rounded-full border border-edge-strong bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:border-brand hover:text-brand"
          aria-label="Toggle color theme"
        >
          <span>{THEME_ICON[theme]}</span>
          <span className="capitalize">{theme}</span>
        </button>
      </div>
    </header>
  );
}
