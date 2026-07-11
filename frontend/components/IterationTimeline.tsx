"use client";

export interface TimelineNode {
  iteration: number;
  status: "done" | "active" | "pending";
  label?: string;
}

export default function IterationTimeline({
  nodes,
  finished,
}: {
  nodes: TimelineNode[];
  finished: boolean;
}) {
  return (
    <div className="border-t border-edge bg-surface px-4 py-3">
      <h2 className="eyebrow mb-2">Iteration Timeline</h2>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {nodes.length === 0 && <span className="text-xs text-ink-subtle">—</span>}
        {nodes.map((n, i) => (
          <div key={n.iteration} className="flex items-center gap-1.5">
            <div
              className={`tnode ${
                n.status === "done"
                  ? "tnode-done"
                  : n.status === "active"
                  ? "tnode-active"
                  : "tnode-pending"
              }`}
            >
              Iter {n.iteration}
            </div>
            {i < nodes.length - 1 && <div className="tconn" />}
          </div>
        ))}
        {finished && (
          <>
            <div className="tconn" />
            <div className="tnode tnode-final">Final</div>
          </>
        )}
      </div>
    </div>
  );
}
