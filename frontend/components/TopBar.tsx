"use client";

import { useRef } from "react";

type ThemeMode = "system" | "light" | "dark";

export interface TargetOption {
  v: string;
  label: string;
}

interface Props {
  target: string;
  setTarget: (v: string) => void;
  targetOptions: TargetOption[];
  framework: string;
  setFramework: (v: string) => void;
  maxIter: number;
  setMaxIter: (v: number) => void;
  datasetLabel: string;
  datasetIsSeed: boolean;
  onUpload: (file: File) => void;
  onResetDataset: () => void;
  uploading: boolean;
  running: boolean;
  onRun: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
}

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
  target, setTarget, targetOptions, framework, setFramework, maxIter, setMaxIter,
  datasetLabel, datasetIsSeed, onUpload, onResetDataset, uploading,
  running, onRun, onOpenSettings, theme, onCycleTheme,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUpload(f);
    e.target.value = ""; // allow re-selecting the same file
  }

  return (
    <header className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-edge bg-surface px-5 py-2.5">
      {/* Title / codename */}
      <div className="mr-2 flex flex-col justify-end self-stretch">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
          Multi-Agent Orchestration
        </span>
        <span className="font-serif text-lg leading-none text-ink">
          Golden&nbsp;Batch{" "}
          <span className="text-brand">Auto&nbsp;Iteration</span>
        </span>
      </div>

      <Field label="Dataset">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={running || uploading}
            className="field-input flex max-w-[190px] items-center gap-1.5 disabled:opacity-60"
            title="Upload a CSV to analyze"
          >
            <span className="text-ink-subtle">{datasetIsSeed ? "▦" : "⤒"}</span>
            <span className="truncate">{uploading ? "Uploading…" : datasetLabel}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          {!datasetIsSeed && (
            <button
              type="button"
              onClick={onResetDataset}
              disabled={running}
              className="text-ink-subtle hover:text-brand"
              title="Back to seed demo"
            >
              ↺
            </button>
          )}
          <a
            href="/sample/golden_batch_demo.csv"
            download
            className="font-mono text-[10px] text-ink-subtle underline decoration-dotted underline-offset-2 hover:text-brand"
            title="Download the lecture demo CSV"
          >
            sample↓
          </a>
        </div>
      </Field>

      <Field label="Outcome (target CQA)">
        <select
          className="field-input min-w-[170px] max-w-[230px]"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={running}
        >
          {targetOptions.map((t) => (
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
        onClick={onOpenSettings}
        disabled={running}
        className="ml-auto self-end flex h-9 w-9 items-center justify-center rounded-ds border border-edge-strong bg-surface text-base text-ink-muted hover:border-brand hover:text-brand disabled:opacity-50"
        aria-label="Agent settings"
        title="Agent 세부 설정"
      >
        ⚙
      </button>

      <button
        onClick={onCycleTheme}
        className="self-end flex items-center gap-1.5 rounded-full border border-edge-strong bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-muted hover:border-brand hover:text-brand"
        aria-label="Toggle color theme"
      >
        <span>{THEME_ICON[theme]}</span>
        <span className="capitalize">{theme}</span>
      </button>
    </header>
  );
}
