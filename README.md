# Golden Batch Multi-Agent

Educational web app demonstrating how Enterprise AI solves **Golden Batch analysis**
through a Multi-Agent architecture. The point is *not* prediction accuracy — it's
**compressing the Data Analyst ↔ MSAT iteration loop**.

- **Analysis Agent** (Python: AutoML / XGBoost / SHAP / stats) → quantitative evidence only
- **MSAT Agent** (Claude + RAG over CDMO docs) → interprets evidence, decides the next analysis
- They iterate until a stopping condition. The **iteration itself** is the lesson.

See **[PRD.md](./PRD.md)** for the full spec (architecture, tools, feature taxonomy).

---

## Status — M0 ✅ · M1 ✅ · M2 ✅ · M3 ✅ · M4 ✅

- **M0 scaffolding** — FastAPI backend (`/api/health`, `POST /api/runs`, SSE events) + Next.js
  3-panel SPA, wired end-to-end. Orchestrator runs the real iteration loop (state machine +
  stopping conditions); both agents return **stub** payloads (real ML in M2, real Claude+RAG in M4).
- **M1 knowledge base + seed data** — `data/golden_batch_demo.csv` (120 batches × 44 features,
  real column taxonomy, planted causal ground truth; drivers recovered by RandomForest, pH>6.9
  group test p≈0.003). Ten CDMO process-transfer docs in `knowledge_base/`, mutually consistent
  and aligned to that ground truth.
- **M2 Analysis Agent (real ML)** — `automl` (sklearn leaderboard), `feature_selection`
  (SHAP-XGB/LGB + Lasso + mutual-info, weighted rank aggregation), `shap_analysis`,
  `model_compare`, `remove_multicollinearity`, `statistical_test`, `correlation_analysis` —
  all on the seed data, returning quantitative evidence only (`interpretation` forced null).
  End-to-end the loop recovers the planted ground truth (VCD_BI driver, pH>6.9 → p≈0.003).
- **M3 RAG** — `knowledge_base/*.md` chunked by H2/H3 heading; lightweight TF keyword
  retrieval (no embedding deps), swappable later. `rag/store.py`.
- **M4 MSAT Agent (real Claude)** — `agents/msat_agent.py` calls the Anthropic API
  (`claude-opus-4-8`), grounds its interpretation in retrieved KB passages, returns a
  structured hypothesis + citations + next action, and drives the loop. Verified
  end-to-end with a real key: it reads the actual SHAP/stat evidence, cites the CDMO
  docs, and converges on the Golden Batch window. Falls back to a scripted stub when no
  key is set, so the demo always runs.
- **Design system** — shared, product-agnostic tokens (`design-system/`, Samsung Blue v1.1.0) with
  a live style guide; the frontend consumes them and matches the guide in light and dark.

## Prerequisites

- Python 3.12+ · Node 20+ / npm 10+
- (Later) an `ANTHROPIC_API_KEY` for the MSAT Agent — not required for M0 stubs.

## Setup

```bash
cp .env.example .env        # then fill ANTHROPIC_API_KEY when ready (M4)
```

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # M0: web deps only
.venv/Scripts/python -m uvicorn main:app --reload --port 8000
```

Health check: <http://127.0.0.1:8000/api/health>

### Frontend

```bash
cd frontend
cp .env.local.example .env.local     # NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
npm install
npm run dev
```

Open <http://localhost:3000> and click **Run**.

## Repo layout

```
PRD.md                       full product spec
Lecture*.ipynb               real analysis notebooks (source of the ML pipeline)
backend/                     FastAPI + orchestrator + agents (stubs in M0)
  main.py  config.py  schemas.py  orchestrator.py
  agents/  rag/  tools/
frontend/                    Next.js App Router SPA (3-panel + SSE)
  app/  components/  lib/eventStream.ts
knowledge_base/              CDMO documents (authored in M1)
data/                        seed dataset (added in M1)
```

## Roadmap

M0 scaffolding ✅ · M1 KB + seed data ✅ · M2 Analysis Agent (real ML) ✅ ·
M3 RAG ✅ · M4 MSAT Agent (Claude) ✅ · M5 orchestrator polish · M6 frontend polish ·
M7 seed scenario · M8 demo rehearsal. (Details in PRD §14.)
