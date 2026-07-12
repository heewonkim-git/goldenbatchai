"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import AgentConversation, { Message } from "@/components/AgentConversation";
import HypothesisTimeline, { HypoStep } from "@/components/HypothesisTimeline";
import { fetchHealth, startRun, StreamEvent } from "@/lib/eventStream";

type ThemeMode = "system" | "light" | "dark";
const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

export default function Page() {
  const [target, setTarget] = useState("[harvest][Harvest] Product. Yield");
  const [framework, setFramework] = useState("autogluon");
  const [maxIter, setMaxIter] = useState(4);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("system");

  const [messages, setMessages] = useState<Message[]>([]);
  const [steps, setSteps] = useState<HypoStep[]>([]);

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

  function push(m: Message) {
    setMessages((prev) => [...prev, m]);
  }

  // track the last analysis tool so a hypothesis can name what informed it
  let lastTool = "";

  function handleEvent(ev: StreamEvent) {
    const d = ev.data as Record<string, any>;
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
        setActivity("MSAT interpreting evidence…");
        break;
      case "msat.result":
        push({
          agent: "msat",
          iteration: d.iteration,
          title: d.interpretation,
          body: `Hypothesis: ${d.hypothesis}`,
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
      case "error":
        push({ agent: "system", iteration: 0, title: `⚠️ ${d.message}` });
        setRunning(false);
        setActivity(null);
        break;
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
        { dataset: "seed", target, automl_framework: framework, max_iteration: maxIter, time_budget_s: 120 },
        handleEvent,
      );
    } catch (e) {
      push({ agent: "system", iteration: 0, title: `⚠️ ${String(e)}` });
      setRunning(false);
      setActivity(null);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        target={target}
        setTarget={setTarget}
        framework={framework}
        setFramework={setFramework}
        maxIter={maxIter}
        setMaxIter={setMaxIter}
        running={running}
        onRun={onRun}
        theme={theme}
        onCycleTheme={cycleTheme}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1.15fr_1fr]">
        <section className="min-h-0 border-r border-edge bg-surface">
          <AgentConversation messages={messages} activity={activity} />
        </section>
        <section className="min-h-0 bg-bg">
          <HypothesisTimeline steps={steps} running={running} finished={finished} />
        </section>
      </div>
    </div>
  );
}
