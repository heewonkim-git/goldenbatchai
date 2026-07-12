"use client";

import { useEffect } from "react";
import { METHOD_NOTES } from "@/lib/statsNotes";
import { Lang, tr } from "@/lib/i18n";

export default function StatsNotes({
  open, onClose, lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-ds-lg border border-edge bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
          <span className="text-sm">🗒️</span>
          <span className="flex-1 font-serif text-sm text-ink">{tr(lang, "notes_title")}</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-ds border border-edge text-ink-subtle hover:border-brand hover:text-brand"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-4 text-[11px] text-ink-subtle">{tr(lang, "notes_intro")}</p>
          <div className="flex flex-col gap-4">
            {METHOD_NOTES.map((n) => {
              const body = lang === "ko" ? n.ko : n.en;
              return (
                <section key={n.key} className="rounded-ds border border-edge p-3">
                  <h3 className="mb-1 font-serif text-[14px] font-semibold text-ink">{n.name}</h3>
                  <p className="mb-2 text-[12.5px] leading-relaxed text-ink-muted">{body.what}</p>
                  <pre
                    className="mb-2 overflow-x-auto whitespace-pre-wrap rounded-ds px-3 py-2 font-mono text-[12px] leading-relaxed"
                    style={{ background: "var(--ds-accent-1-bg)", color: "var(--ds-brand)" }}
                  >
                    {n.formula}
                  </pre>
                  <p className="text-[12px] leading-relaxed text-ink-subtle">{body.read}</p>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
