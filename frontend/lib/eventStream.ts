// SSE client for the orchestrator event stream (PRD §10.3).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export type EventType =
  | "run.started"
  | "analysis.started"
  | "analysis.result"
  | "msat.started"
  | "msat.retrieval"
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
  "msat.retrieval",
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
  analysis_config?: unknown;
  msat_config?: unknown;
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
  let done = false; // stream reached a natural end (finished or fatal server error)

  // Server-sent, data-bearing events (everything except the ambiguous "error",
  // which is handled separately because the browser reuses "error" for the
  // native connection-failure event that carries no data).
  for (const type of EVENT_TYPES) {
    if (type === "error") continue;
    es.addEventListener(type, (e: MessageEvent) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(e.data);
      } catch {
        /* ignore malformed */
      }
      onEvent({ type, data });
      if (type === "run.finished") {
        done = true;
        es.close();
      }
    });
  }

  es.addEventListener("error", (e: MessageEvent) => {
    if (e && e.data) {
      // a real server-sent error event (SSE `event: error` with a JSON body)
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(e.data);
      } catch {
        /* ignore malformed */
      }
      onEvent({ type: "error", data });
      if (data.fatal === true) {
        done = true;
        es.close();
      }
      return;
    }
    // native connection-level error (no payload). Ignore the harmless blip that
    // can fire right after we close a finished stream; otherwise the backend is
    // unreachable — report once and stop (no silent auto-reconnect storm).
    if (done) return;
    done = true;
    es.close();
    onEvent({
      type: "error",
      data: {
        stage: "connection",
        fatal: true,
        message:
          "백엔드에 연결하지 못했습니다. 서버가 재배포·콜드스타트 중일 수 있어요. 잠시 후 다시 Run 해주세요.",
      },
    });
  });

  return es;
}

export interface UploadResult {
  datasetId: string;
  filename: string;
  columns: string[];
  n_rows: number;
  targetCandidates: string[];
}

/** Upload raw CSV text; returns the dataset id + column metadata. */
export async function uploadDataset(csv: string, filename: string): Promise<UploadResult> {
  const res = await fetch(`${API_BASE}/api/datasets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv, filename }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as UploadResult;
}

export async function fetchHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

// --- settings: analysis defaults + knowledge base ---------------------------

export interface AnalysisDefaults {
  test_size: number;
  cv_folds: number;
  random_state: number;
  p_value_alpha: number;
  num_selected: number;
  shap_runs: number;
  models: Record<string, Record<string, number>>;
}

export interface KbDocMeta {
  id: string;
  title: string;
  version: number;
  sections: number;
}

export async function fetchAnalysisDefaults(): Promise<AnalysisDefaults> {
  return (await fetch(`${API_BASE}/api/analysis-defaults`)).json();
}

export async function fetchKbDocs(): Promise<KbDocMeta[]> {
  const r = await (await fetch(`${API_BASE}/api/kb`)).json();
  return r.documents as KbDocMeta[];
}

export async function uploadKbDoc(file: File, docId: string): Promise<{ id: string; version: number; documents: KbDocMeta[] }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("doc_id", docId);
  const res = await fetch(`${API_BASE}/api/kb/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      detail = ((await res.json()) as { detail?: string }).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}
