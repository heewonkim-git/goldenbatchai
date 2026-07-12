"use client";

import { useEffect, useRef, useState } from "react";
import { KbDocMeta, uploadKbDoc } from "@/lib/eventStream";

export interface ModelCfgT {
  enabled: boolean;
  params: Record<string, number>;
}
export interface AnalysisConfigT {
  test_size: number;
  cv_folds: number;
  random_state: number;
  p_value_alpha: number;
  num_selected: number;
  shap_runs: number;
  models: Record<string, ModelCfgT>;
}
export interface MsatConfigT {
  enabled_docs: string[] | null;
  retrieval_k: number;
}

type Agent = "analysis" | "msat";

function prettify(key: string) {
  return key.replace(/_/g, " ");
}
function stepFor(key: string) {
  return /rate|subsample|size|alpha/.test(key) ? 0.05 : 1;
}

function Num({
  label, value, onChange, step = 1, min, max, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  step?: number; min?: number; max?: number; hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">{label}</span>
      <input
        type="number" className="field-input" value={value} step={step} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="text-[10px] text-ink-subtle">{hint}</span>}
    </label>
  );
}

export default function SettingsModal({
  open, onClose, analysis, msat, kbDocs, onSave, onKbChange,
}: {
  open: boolean;
  onClose: () => void;
  analysis: AnalysisConfigT | null;
  msat: MsatConfigT;
  kbDocs: KbDocMeta[];
  onSave: (a: AnalysisConfigT | null, m: MsatConfigT) => void;
  onKbChange: (docs: KbDocMeta[]) => void;
}) {
  const [agent, setAgent] = useState<Agent>("analysis");
  const [dA, setDA] = useState<AnalysisConfigT | null>(analysis);
  const [dM, setDM] = useState<MsatConfigT>(msat);
  const [busy, setBusy] = useState<string | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const verFileRef = useRef<HTMLInputElement>(null);
  const verTarget = useRef<string>("");

  useEffect(() => { if (open) { setDA(analysis); setDM(msat); } }, [open, analysis, msat]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const docEnabled = (id: string) => dM.enabled_docs === null || dM.enabled_docs.includes(id);
  function toggleDoc(id: string) {
    const cur = dM.enabled_docs ?? kbDocs.map((d) => d.id);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setDM({ ...dM, enabled_docs: next });
  }

  async function doUpload(file: File, docId: string) {
    setBusy(docId ? "새 버전 업로드 중…" : "새 문서 업로드 중…");
    try {
      const r = await uploadKbDoc(file, docId);
      onKbChange(r.documents);
      if (!docId) {
        // enable the freshly added doc
        const cur = dM.enabled_docs ?? r.documents.map((d) => d.id);
        setDM({ ...dM, enabled_docs: Array.from(new Set([...cur, r.id])) });
      }
    } catch (e) {
      window.alert(`업로드 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  const setModel = (name: string, mc: ModelCfgT) =>
    dA && setDA({ ...dA, models: { ...dA.models, [name]: mc } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-ds-lg border border-edge bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
          <span className="text-sm">⚙</span>
          <span className="flex-1 font-serif text-sm text-ink">Agent Settings</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-ds border border-edge text-ink-subtle hover:border-brand hover:text-brand"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* left: agent selector */}
          <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-edge bg-surface-2 p-3">
            {(["analysis", "msat"] as Agent[]).map((a) => (
              <button
                key={a}
                onClick={() => setAgent(a)}
                className={`flex items-center gap-2 rounded-ds px-3 py-2 text-left text-[13px] transition-colors ${
                  agent === a ? "bg-brand/12 font-semibold text-brand" : "text-ink-muted hover:bg-surface"
                }`}
              >
                <span>{a === "analysis" ? "🧮" : "🧠"}</span>
                {a === "analysis" ? "Analysis Agent" : "MSAT Agent"}
              </button>
            ))}
            <p className="mt-auto px-1 text-[10px] leading-snug text-ink-subtle">
              설정은 다음 Run부터 실제 파이프라인에 적용됩니다.
            </p>
          </nav>

          {/* right: params */}
          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            {agent === "analysis" && (
              !dA ? (
                <p className="text-xs text-ink-subtle">기본값 불러오는 중…</p>
              ) : (
                <div className="flex flex-col gap-5">
                  <section>
                    <h3 className="eyebrow mb-2">Data &amp; validation</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Num label="Test split" value={dA.test_size} step={0.05} min={0.05} max={0.5}
                        hint={`train ${Math.round((1 - dA.test_size) * 100)} : ${Math.round(dA.test_size * 100)} test`}
                        onChange={(v) => setDA({ ...dA, test_size: v })} />
                      <Num label="CV folds" value={dA.cv_folds} min={2} max={10}
                        onChange={(v) => setDA({ ...dA, cv_folds: v })} />
                      <Num label="p-value α" value={dA.p_value_alpha} step={0.005} min={0.001} max={0.2}
                        hint="significance cutoff"
                        onChange={(v) => setDA({ ...dA, p_value_alpha: v })} />
                      <Num label="Features kept" value={dA.num_selected} min={3} max={40}
                        onChange={(v) => setDA({ ...dA, num_selected: v })} />
                      <Num label="SHAP runs" value={dA.shap_runs} min={1} max={10}
                        onChange={(v) => setDA({ ...dA, shap_runs: v })} />
                      <Num label="Random state" value={dA.random_state} min={0}
                        onChange={(v) => setDA({ ...dA, random_state: v })} />
                    </div>
                  </section>

                  <section>
                    <h3 className="eyebrow mb-2">Models &amp; hyperparameters</h3>
                    <div className="flex flex-col gap-3">
                      {Object.entries(dA.models).map(([name, mc]) => (
                        <div key={name} className="rounded-ds border border-edge p-3">
                          <label className="mb-2 flex items-center gap-2">
                            <input type="checkbox" checked={mc.enabled}
                              onChange={(e) => setModel(name, { ...mc, enabled: e.target.checked })}
                              className="accent-brand" />
                            <span className="text-[13px] font-semibold text-ink">{name}</span>
                            {!mc.enabled && <span className="text-[10px] text-ink-subtle">(제외됨)</span>}
                          </label>
                          <div className={`grid grid-cols-3 gap-3 ${mc.enabled ? "" : "opacity-40"}`}>
                            {Object.entries(mc.params).map(([k, v]) => (
                              <Num key={k} label={prettify(k)} value={v} step={stepFor(k)} min={0}
                                onChange={(nv) => setModel(name, { ...mc, params: { ...mc.params, [k]: nv } })} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )
            )}

            {agent === "msat" && (
              <div className="flex flex-col gap-5">
                <section>
                  <h3 className="eyebrow mb-2">Retrieval</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Num label="Passages (k)" value={dM.retrieval_k} min={1} max={12}
                      hint="검색 근거 개수"
                      onChange={(v) => setDM({ ...dM, retrieval_k: v })} />
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="eyebrow">Grounding documents (.docx)</h3>
                    <button
                      onClick={() => newFileRef.current?.click()}
                      className="rounded-ds border border-edge px-2 py-1 text-[11px] text-ink-muted hover:border-brand hover:text-brand"
                    >
                      ＋ 새 문서
                    </button>
                  </div>
                  <p className="mb-2 text-[11px] text-ink-subtle">
                    체크된 문서만 근거로 사용합니다. {busy && <span className="text-brand">· {busy}</span>}
                  </p>
                  <div className="flex flex-col divide-y divide-edge overflow-hidden rounded-ds border border-edge">
                    {kbDocs.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 px-3 py-2">
                        <input type="checkbox" checked={docEnabled(d.id)}
                          onChange={() => toggleDoc(d.id)} className="accent-brand" />
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{d.title}</span>
                        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">
                          v{d.version}
                        </span>
                        <button
                          onClick={() => { verTarget.current = d.id; verFileRef.current?.click(); }}
                          className="font-mono text-[10px] text-ink-subtle underline decoration-dotted hover:text-brand"
                          title="이 문서의 새 버전(.docx) 업로드"
                        >
                          새 버전⤒
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <input ref={newFileRef} type="file" accept=".docx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(f, ""); e.target.value = ""; }} />
                <input ref={verFileRef} type="file" accept=".docx" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(f, verTarget.current); e.target.value = ""; }} />
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-edge px-4 py-2.5">
          <button onClick={onClose} className="btn text-ink-muted hover:text-ink">취소</button>
          <button onClick={() => { onSave(dA, dM); onClose(); }} className="btn btn-primary">저장</button>
        </div>
      </div>
    </div>
  );
}
