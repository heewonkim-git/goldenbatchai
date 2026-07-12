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
  theme: ThemeMode;
  onCycleTheme: () => void;
}

const TARGETS = [
  { v: "[harvest][Harvest] Product. Yield", label: "USP Harvest Yield" },
  { v: "DSP_Final_Protein (g)", label: "DSP Final Protein" },
];
const THEME_ICON: Record<ThemeMode, string> = { system: "◐", light: "☀", dark: "☾" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function TopBar({
  target, setTarget, framework, setFramework, maxIter, setMaxIter,
  running, onRun, theme, onCycleTheme,
}: Props) {
  return (
    <header className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-edge bg-surface px-5 py-2.5">
      {/* Title / codename */}
      <div className="mr-2 flex flex-col justify-end self-stretch">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
          Multi-Agent Pipeline
        </span>
        <span className="font-serif text-lg leading-none text-ink">
          Golden&nbsp;Batch{" "}
          <span className="text-brand">Iteration&nbsp;Highpass</span>
        </span>
      </div>

      <Field label="Outcome (target CQA)">
        <select
          className="field-input min-w-[170px]"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={running}
        >
          {TARGETS.map((t) => (
            <option key={t.v} value={t.v}>{t.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Model library (AutoML)">
        <select
          className="field-input"
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          disabled={running}
        >
          <option value="autogluon">AutoGluon</option>
          <option value="h2o">H2O AutoML</option>
        </select>
      </Field>

      <Field label="Max iterations">
        <input
          type="number"
          min={1}
          max={10}
          className="field-input w-16"
          value={maxIter}
          onChange={(e) => setMaxIter(Number(e.target.value))}
          disabled={running}
        />
      </Field>

      <button onClick={onRun} disabled={running} className="btn btn-primary self-end">
        {running ? "Running…" : "▶ Run"}
      </button>

      <button
        onClick={onCycleTheme}
        className="ml-auto self-end flex items-center gap-1.5 rounded-full border border-edge-strong bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:border-brand hover:text-brand"
        aria-label="Toggle color theme"
      >
        <span>{THEME_ICON[theme]}</span>
        <span className="capitalize">{theme}</span>
      </button>
    </header>
  );
}
