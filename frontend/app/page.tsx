"use client";

import { useEffect, useRef, useState } from "react";
import TopBar, { TargetOption } from "@/components/TopBar";
import AgentConversation, { Message } from "@/components/AgentConversation";
import HypothesisTimeline, { HypoStep } from "@/components/HypothesisTimeline";
import { fetchHealth, startRun, uploadDataset, StreamEvent } from "@/lib/eventStream";

type ThemeMode = "system" | "light" | "dark";
const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

const SEED_TARGETS: TargetOption[] = [
  { v: "[harvest][Harvest] Product. Yield", label: "USP Harvest Yield" },
  { v: "DSP_Final_Protein (g)", label: "DSP Final Protein" },
];

type PaneMode = "split" | "left" | "right";

// short, human label for an arbitrary uploaded column name
function shortLabel(col: string): string {
  return col.replace(/\[[^\]]*\]/g, " ").replace(/_/g, " ").replace(/\s+/g, " ").trim() || col;
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
    </svg>
  );
}
function RestoreIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" />
    </svg>
  );
}

function PaneControls({
  isFull, onExpand, onRestore,
}: { isFull: boolean; onExpand: () => void; onRestore: () => void }) {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-ds border border-edge " +
    "bg-surface/85 backdrop-blur transition-colors";
  return (
    <div className="absolute right-2.5 top-2.5 z-20 flex gap-1">
      <button
        onClick={onExpand}
        disabled={isFull}
        title="Fullscreen this panel"
        aria-label="Fullscreen this panel"
        className={`${base} ${isFull ? "text-ink-subtle/40" : "text-ink-muted hover:border-brand hover:text-brand"}`}
      >
        <ExpandIcon />
      </button>
      <button
        onClick={onRestore}
        disabled={!isFull}
        title="Restore split view"
        aria-label="Restore split view"
        className={`${base} ${!isFull ? "text-ink-subtle/40" : "text-ink-muted hover:border-brand hover:text-brand"}`}
      >
        <RestoreIcon />
      </button>
    </div>
  );
}

export default function Page() {
  const [target, setTarget] = useState(SEED_TARGETS[0].v);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>(SEED_TARGETS);
  const [framework, setFramework] = useState("autogluon");
  const [maxIter, setMaxIter] = useState(4);

  const [dataset, setDataset] = useState("seed");
  const [datasetLabel, setDatasetLabel] = useState("Seed demo");
  const [uploading, setUploading] = useState(false);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("system");

  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps] = useState<HypoStep[]>([]);

  // resizable / fullscreen panes
  const [leftPct, setLeftPct] = useState(54);
  const [mode, setMode] = useState<PaneMode>("split");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHealth().catch(() => {}); // warm the backend (HF Space cold start)
  }, []);

  function cycleTheme() {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
  }

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    function move(ev: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(78, Math.max(22, pct)));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function push(m: Message) {
    setMessages((prev) => [...prev, m]);
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const text = await file.text();
      const r = await uploadDataset(text, file.name);
      setDataset(r.datasetId);
      setDatasetLabel(`${file.name} · ${r.n_rows}×${r.columns.length}`);
      const opts: TargetOption[] = r.targetCandidates.map((c) => ({ v: c, label: shortLabel(c) }));
      setTargetOptions(opts.length ? opts : [{ v: r.columns[0], label: shortLabel(r.columns[0]) }]);
      if (opts.length) setTarget(opts[0].v);
    } catch (e) {
      window.alert(`CSV 업로드 실패:\n${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
    }
  }

  function onResetDataset() {
    setDataset("seed");
    setDatasetLabel("Seed demo");
    setTargetOptions(SEED_TARGETS);
    setTarget(SEED_TARGETS[0].v);
  }

  // track the last analysis tool so a hypothesis can name what informed it
  let lastTool = "";

  function handleEvent(ev: StreamEvent) {
    const d = (ev.data ?? {}) as Record<string, any>;
    switch (ev.type) {
      case "run.started":
        push({ agent: "system", iteration: 0, title: `Run started · ${d.target}` });
        setActivity("Starting…");
        break;
      case "analysis.started":
        lastTool = d.tool;
        setActivity(`Analysis · ${d.tool}…`);
        break;
      case "analysis.result":
        push({ agent: "analysis", iteration: d.iteration, title: "", tool: d.tool, evidence: d.evidence });
        break;
      case "msat.started":
        setActivity("MSAT retrieving docs & interpreting…");
        break;
      case "msat.result":
        push({
          agent: "msat",
          iteration: d.iteration,
          title: d.interpretation,
          body: `Hypothesis: ${d.hypothesis}`,
          citations: d.citations ?? [],
        });
        setSteps((prev) => [
          ...prev,
          {
            iteration: d.iteration,
            hypothesis: d.hypothesis,
            confidence: d.confidence,
            citations: d.citations ?? [],
            nextAction: d.next_action,
            fromTool: lastTool,
            final: false,
          },
        ]);
        setActivity(null);
        break;
      case "iteration.completed":
        break;
      case "run.finished":
        setSteps((prev) =>
          prev.map((s, i) => (i === prev.length - 1 ? { ...s, final: true } : s)),
        );
        setFinished(true);
        setRunning(false);
        setActivity(null);
        break;
      case "error": {
        const msg = d.message ?? d.detail ?? "unknown error";
        const where = d.stage ? ` (${d.stage})` : "";
        push({ agent: "system", iteration: 0, title: `⚠️ ${msg}${where}` });
        if (d.fatal !== false) {
          setRunning(false);
          setActivity(null);
        }
        break;
      }
    }
  }

  async function onRun() {
    setMessages([]);
    setSteps([]);
    setFinished(false);
    setRunning(true);
    setActivity("Starting…");
    try {
      await startRun(
        { dataset, target, automl_framework: framework, max_iteration: maxIter, time_budget_s: 120 },
        handleEvent,
      );
    } catch (e) {
      push({ agent: "system", iteration: 0, title: `⚠️ ${e instanceof Error ? e.message : String(e)}` });
      setRunning(false);
      setActivity(null);
    }
  }

  const showLeft = mode !== "right";
  const showRight = mode !== "left";
  const leftStyle =
    mode === "left" ? { flex: "1 1 auto" } : mode === "split" ? { width: `${leftPct}%` } : {};
  const rightStyle =
    mode === "right" ? { flex: "1 1 auto" } : mode === "split" ? { width: `${100 - leftPct}%` } : {};

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        target={target}
        setTarget={setTarget}
        targetOptions={targetOptions}
        framework={framework}
        setFramework={setFramework}
        maxIter={maxIter}
        setMaxIter={setMaxIter}
        datasetLabel={datasetLabel}
        datasetIsSeed={dataset === "seed"}
        onUpload={onUpload}
        onResetDataset={onResetDataset}
        uploading={uploading}
        running={running}
        onRun={onRun}
        theme={theme}
        onCycleTheme={cycleTheme}
      />

      <div ref={containerRef} className="flex min-h-0 flex-1">
        {showLeft && (
          <section
            style={leftStyle}
            className="relative min-h-0 shrink-0 grow-0 border-r border-edge bg-surface"
          >
            <PaneControls
              isFull={mode === "left"}
              onExpand={() => setMode("left")}
              onRestore={() => setMode("split")}
            />
            <AgentConversation messages={messages} activity={activity} />
          </section>
        )}

        {mode === "split" && (
          <div
            onPointerDown={startDrag}
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize"
            className="group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-edge hover:bg-brand/40"
          >
            <span className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
              <span className="h-8 w-[3px] rounded-full bg-edge-strong group-hover:bg-brand" />
            </span>
          </div>
        )}

        {showRight && (
          <section
            style={rightStyle}
            className="relative min-h-0 shrink-0 grow-0 bg-bg"
          >
            <PaneControls
              isFull={mode === "right"}
              onExpand={() => setMode("right")}
              onRestore={() => setMode("split")}
            />
            <HypothesisTimeline steps={steps} running={running} finished={finished} />
          </section>
        )}
      </div>
    </div>
  );
}
