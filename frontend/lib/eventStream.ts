// SSE client for the orchestrator event stream (PRD §10.3).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export type EventType =
  | "run.started"
  | "analysis.started"
  | "analysis.result"
  | "msat.started"
  | "msat.token"
  | "msat.result"
  | "iteration.completed"
  | "run.finished"
  | "error";

export const EVENT_TYPES: EventType[] = [
  "run.started",
  "analysis.started",
  "analysis.result",
  "msat.started",
  "msat.token",
  "msat.result",
  "iteration.completed",
  "run.finished",
  "error",
];

export interface StreamEvent {
  type: EventType;
  data: Record<string, unknown>;
}

export interface RunConfig {
  dataset: string;
  target: string;
  automl_framework: string;
  max_iteration: number;
  time_budget_s: number;
}

/** POST a run, then open an EventSource and forward each named event. */
export async function startRun(
  config: RunConfig,
  onEvent: (ev: StreamEvent) => void,
): Promise<EventSource> {
  const res = await fetch(`${API_BASE}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`create run failed: ${res.status}`);
  const { runId } = (await res.json()) as { runId: string };

  const es = new EventSource(`${API_BASE}/api/runs/${runId}/events`);
  for (const type of EVENT_TYPES) {
    es.addEventListener(type, (e: MessageEvent) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(e.data);
      } catch {
        /* ignore malformed */
      }
      onEvent({ type, data });
      if (type === "run.finished" || type === "error") es.close();
    });
  }
  return es;
}

export async function fetchHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
