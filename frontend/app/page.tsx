"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import AgentConversation, { Message } from "@/components/AgentConversation";
import HypothesisPanel, { Hypothesis } from "@/components/HypothesisPanel";
import IterationTimeline, { TimelineNode } from "@/components/IterationTimeline";
import { fetchHealth, startRun, StreamEvent } from "@/lib/eventStream";

type ThemeMode = "system" | "light" | "dark";
const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

export default function Page() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [target, setTarget] = useState("[harvest][Harvest] Product. Yield");
  const [framework, setFramework] = useState("autogluon");
  const [maxIter, setMaxIter] = useState(4);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("system");

  const [messages, setMessages] = useState<Message[]>([]);
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth(null));
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

  function upsertNode(iteration: number, status: TimelineNode["status"]) {
    setNodes((prev) => {
      const others = prev.filter((n) => n.iteration !== iteration);
      return [...others, { iteration, status }].sort(
        (a, b) => a.iteration - b.iteration,
      );
    });
  }

  function handleEvent(ev: StreamEvent) {
    const d = ev.data as Record<string, any>;
    switch (ev.type) {
      case "run.started":
        push({ agent: "system", iteration: 0, title: `Run started · ${d.target}` });
        setActivity("Starting…");
        break;
      case "analysis.started":
        upsertNode(d.iteration, "active");
        setActivity(`🧮 Analysis · ${d.tool}…`);
        break;
      case "analysis.result":
        push({ agent: "analysis", iteration: d.iteration, title: "", tool: d.tool, evidence: d.evidence });
        break;
      case "msat.started":
        setActivity("🧠 MSAT interpreting evidence…");
        break;
      case "msat.result":
        push({
          agent: "msat",
          iteration: d.iteration,
          title: d.interpretation,
          body: `Hypothesis: ${d.hypothesis}`,
        });
        setHypothesis({
          iteration: d.iteration,
          hypothesis: d.hypothesis,
          confidence: d.confidence,
          citations: d.citations ?? [],
          nextAction: d.next_action,
        });
        setActivity(null);
        break;
      case "iteration.completed":
        upsertNode(d.iteration, "done");
        break;
      case "run.finished":
        push({ agent: "system", iteration: 0, title: `✅ Final: ${d.finalRecommendation}` });
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
    setHypothesis(null);
    setNodes([]);
    setFinished(false);
    setRunning(true);
    setActivity("Starting…");
    try {
      await startRun(
        {
          dataset: "seed",
          target,
          automl_framework: framework,
          max_iteration: maxIter,
          time_budget_s: 120,
        },
        handleEvent,
      );
    } catch (e) {
      push({ agent: "system", iteration: 0, title: `⚠️ ${String(e)}` });
      setRunning(false);
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
        health={health}
        theme={theme}
        onCycleTheme={cycleTheme}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <section className="min-h-0 border-r border-edge bg-surface">
          <AgentConversation messages={messages} activity={activity} />
        </section>
        <section className="min-h-0 bg-surface">
          <HypothesisPanel h={hypothesis} />
        </section>
      </div>

      <IterationTimeline nodes={nodes} finished={finished} />
    </div>
  );
}
