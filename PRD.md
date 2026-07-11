# PRD — Golden Batch Multi-Agent

> Educational web application demonstrating how Enterprise AI solves Golden Batch analysis through a **Multi-Agent architecture**.

**Version:** 0.1 (draft)
**Date:** 2026-07-11
**Owner:** work.wonniey@gmail.com

---

## 0. TL;DR

이 앱은 "예측 정확도를 높이는 ML 프로젝트"가 아니라, **Data Analyst ↔ MSAT 전문가 사이의 반복(iteration) 사이클을 AI가 압축하는 과정**을 시각적으로 보여주는 교육용 도구다.

- **Analysis Agent** (Python: XGBoost / SHAP / scipy) → *정량적 증거만* 생산
- **MSAT Agent** (Claude + RAG over CDMO 문서) → 증거를 해석하고, 다음 분석 전략을 설계하고, 재분석을 요청
- 두 에이전트가 **stopping condition까지 반복** → 그 반복 과정 자체가 교육의 핵심

핵심 메시지: **문제 정의가 AI 아키텍처를 결정한다. ML은 증거를 만들고, LLM은 증거를 설명하며, 도메인 지식이 가치를 만든다. 에이전트는 전문가의 반복을 압축한다.**

---

## 1. Vision & Educational Message

### 1.1 우리가 가르치려는 것

| Slogan | 앱에서 어떻게 드러나는가 |
|---|---|
| Problem Definition determines AI Architecture | Golden Batch를 "정확도 문제"가 아니라 "iteration 압축 문제"로 재정의한 것이 멀티에이전트 구조를 낳았음을 UI가 설명 |
| Machine Learning produces evidence | Analysis Agent는 절대 결론(process knowledge)을 내지 않고 숫자/통계만 반환 |
| LLM explains evidence | MSAT Agent가 SHAP/통계 결과를 공정 언어로 번역 |
| Domain Knowledge creates value | RAG가 CDMO 문서(SOP, CPP-CQA Matrix 등)를 근거로 해석 |
| Agents compress expert iteration | Iteration Timeline이 "며칠 걸릴 전문가 왕복"을 수 분으로 압축 |

### 1.2 무엇이 목표가 *아닌가* (Non-Goals)

- ❌ 예측 정확도 극대화 (R², RMSE 최소화가 목표가 아님)
- ❌ 프로덕션급 MLOps / 모델 서빙 파이프라인
- ❌ 실제 GMP 규제 검증 도구 (교육용 시뮬레이션임을 명시)
- ❌ 다중 사용자 / 인증 / 영속 DB (로컬 데모 우선)

---

## 2. Business Problem

Golden Batch 프로젝트는 흔히 머신러닝 정확도 문제로 오해된다. 실제 병목은 다음 두 역할 사이의 **반복적 왕복**이다.

- **Data Analyst** — 데이터를 돌리고 통계/모델 결과를 산출
- **MSAT / Manufacturing SME** — 결과를 공정 지식으로 해석하고, 다음에 무엇을 볼지 결정

실제 워크플로우:

```
Analysis → Interpretation → Additional Analysis → Re-analysis → ...
```

이 왕복은 조직에서 **며칠~몇 주** 걸린다 (미팅, 이메일, 재요청). AI 시스템의 목표는 이 사이클을 **자동으로 압축**하는 것이다.

---

## 3. Goals & Success Criteria

### 3.1 Product Goals

1. 업로드한 batch CSV에 대해 **실제 XGBoost/SHAP/통계 분석**을 실행한다.
2. **실제 Claude API + RAG**로 그 결과를 CDMO 문서에 근거해 해석한다.
3. Analysis ↔ MSAT의 **반복 루프**를 사용자가 지정한 max iteration까지 자동 수행한다.
4. 매 iteration의 **가설 진화 / 근거 / 다음 액션**을 실시간으로 시각화한다.
5. 발표 안정성을 위해 **시드 CSV + 시드 시나리오**를 내장한다 (실동작과 병행).

### 3.2 Success Criteria (데모가 "성공"이라 부를 조건)

- 관객이 "왜 멀티에이전트인가"를 **UI만 보고** 설명할 수 있다.
- 하나의 batch 데이터셋에 대해 최소 **3회 iteration**이 서로 다른 가설/근거로 진행되는 것이 보인다.
- Analysis Agent 출력에 **process 결론이 섞여 있지 않다** (숫자/통계만).
- MSAT Agent 출력에 **문서 인용(citation)**이 붙는다.
- 전체 데모가 인터넷 없이(로컬) **재현 가능**하다 (시드 모드).

---

## 4. Personas

| Persona | 목표 | 앱에서의 관심 |
|---|---|---|
| **발표자 (본인)** | 고객/내부에 Enterprise AI 개념 시연 | 안정적 재현, 명확한 스토리텔링 |
| **관객 — 경영/기획** | "AI가 뭘 바꾸나" 이해 | Iteration 압축, 가치 창출 스토리 |
| **관객 — 데이터/엔지니어** | "실제로 도는가" 검증 | 실제 SHAP 값, 실제 LLM 추론, 코드 |
| **관객 — MSAT/공정 SME** | "내 지식이 어떻게 쓰이나" | RAG 문서 인용, 공정 해석의 타당성 |

---

## 5. System Architecture

### 5.1 High-Level

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js SPA (Frontend)                  │
│   Upload CSV │ Model select │ Max iter │ Run                 │
│   ┌──────────────┬───────────────────┬────────────────────┐ │
│   │ Agent        │ Current           │ Iteration          │ │
│   │ Conversation │ Hypothesis        │ Timeline           │ │
│   └──────────────┴───────────────────┴────────────────────┘ │
└───────────────▲───────────────────────────┬─────────────────┘
                │ SSE / WS (stream events)   │ REST (start run)
                │                            ▼
┌───────────────┴─────────────────────────────────────────────┐
│                  FastAPI (Python service)                    │
│                                                              │
│   ┌────────────────  Orchestrator  ────────────────────┐    │
│   │  iteration loop / state machine / stop conditions   │   │
│   └───────▲──────────────────────────────────▲──────────┘   │
│           │                                   │              │
│   ┌───────┴────────┐                 ┌────────┴─────────┐    │
│   │ Analysis Agent │                 │   MSAT Agent     │    │
│   │  (Python ML)   │                 │ (Claude + RAG)   │    │
│   │  pandas        │                 │  - interpret     │    │
│   │  xgboost       │                 │  - search SOP    │    │
│   │  shap          │                 │  - decide next   │    │
│   │  scipy         │                 │  - request re-run│    │
│   └────────────────┘                 └────────┬─────────┘    │
│                                               │              │
│                                      ┌────────▼─────────┐    │
│                                      │  RAG / KB store  │    │
│                                      │ (CDMO documents) │    │
│                                      └──────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Component Responsibilities

- **Frontend (Next.js, App Router)** — SPA. 업로드/설정/Run 트리거, 이벤트 스트림 구독, 3-패널 시각화.
- **Orchestrator (FastAPI)** — iteration 루프의 상태 기계. 어떤 에이전트를 언제 호출할지, 언제 멈출지 결정. 모든 단계에서 이벤트를 프론트로 stream.
- **Analysis Agent** — 도구 모음(아래 6절). 입력: DataFrame + 분석 요청(tool + params). 출력: **정량 증거 JSON만**.
- **MSAT Agent** — Claude 호출 + RAG. 입력: Analysis 증거 + KB. 출력: 해석 + 다음 액션(재분석 요청 or 종료).
- **RAG / KB store** — CDMO 문서 임베딩/검색. 규모가 작으므로 경량 인메모리 벡터스토어로 시작.

### 5.3 실동작 + 시드 데모 전략

- **Live mode** — 사용자가 CSV 업로드 → 실제 ML + 실제 Claude 호출.
- **Seed mode** — 내장 `golden_batch_demo.csv` + 예상 시나리오. Claude/ML은 실제로 돌되, 데이터가 고정이라 재현성 확보. 네트워크 불가 시 캐시된 응답으로 폴백(옵션).
- 토글: UI 상단 "Demo dataset 사용" 체크박스 + `SEED_MODE` env.

---

## 6. Analysis Agent (정량 증거 전용)

> **철칙: Analysis Agent는 절대 process 결론을 내지 않는다. 숫자·통계·순위·p-value·모델 성능만 반환한다.** 해석은 전적으로 MSAT Agent의 몫.

이 절의 도구 설계는 **실제 강의 노트북(Lecture6/7/10)의 mAb CDMO 분석 파이프라인**을 그대로 제품화한 것이다. (부록 B: 노트북 → 도구 매핑, 부록 C: 실제 feature 택소노미 참조)

### 6.0 실제 파이프라인 (근거: Lecture10 / Lecture7 / Lecture6)

Analysis Agent가 내부적으로 실행하는 표준 분석 파이프라인. MSAT Agent는 이 중 어느 단계든 파라미터를 지정해 재호출한다.

```
[0] Preprocess     : 수치형 선별 → label-encode(범주형) → inf→NaN → median impute
[1] De-collinearity: Spearman |ρ|>0.9 컬럼 제거  (+ 옵션 VIF)
[2] AutoML         : AutoGluon / H2O AutoML → leaderboard, best model, CV RMSE
[3] Feature Select : {SHAP(XGB), SHAP(LGB), Lasso, MutualInfo, Boruta, PCA} 앙상블
                     → rank 집계(SHAP 가중=2) → overlap → find_optimal_feature_count
[4] Model Compare  : RandomForest / GradientBoosting / XGBoost / LightGBM (+CatBoost)
                     → 각 모델 CV RMSE + per-model SHAP
[5] Tune           : Optuna(objective=RMSE, n_trials=50) → best_params → 5-fold CV
[6] Explain (XAI)  : global mean|SHAP| bar / beeswarm / dependence / interaction
[7] Stats          : t-test / ANOVA / Mann-Whitney / Spearman·Pearson corr (+p-value)
```

> **주의:** 파이프라인의 각 산출물은 *숫자*다. "pH가 수율을 낮춘다"는 결론은 절대 내지 않고, "feature `[prd_final]pH_BI`의 mean|SHAP|=0.184, 방향 음(-)"까지만 보고한다.

### 6.1 Tools

| Tool | 입력 | 출력 (evidence JSON) | 라이브러리 / 근거 셀 |
|---|---|---|---|
| `preprocess` | df, target | 정제 후 shape, dropped/encoded/imputed 컬럼 수, 결측 통계 | pandas · L10 c6 |
| `remove_multicollinearity` | df, target, threshold=0.9 | 제거된 컬럼 목록, 잔존 feature 수, 상관 히트맵 데이터 | Spearman corr · L10 c5 |
| `automl` | df, target, time_limit, framework | leaderboard(모델별 RMSE), best_model, test RMSE/R²/MAE | AutoGluon·H2O · L7 |
| `feature_selection` | df, target, methods[], num_selected | method별 top-k, 집계 랭킹, overlap 집합, 선정 feature | SHAP/Lasso/MI/Boruta/PCA · L10 c14-24 |
| `optimal_feature_count` | df, target, method, range | k별 CV RMSE 곡선, 최적 k | L10 c24 |
| `model_compare` | df, target, models[] | 모델별 CV RMSE(±std), per-model SHAP top-k | RF/GBM/XGB/LGB · L10 c27-29 |
| `shap_analysis` | df, target, model | mean\|SHAP\| 랭킹, 방향성, base_value, beeswarm/dependence 좌표 | shap.TreeExplainer · L10 c6, L6 c26 |
| `hyperparameter_tune` | df, target, model, n_trials | best_params, tuned CV RMSE, 개선폭 | Optuna · L10 c31-32 |
| `statistical_test` | df, feature, group_rule | test종류, 통계량, p-value, 그룹별 평균/표준편차/n | scipy.stats · L10 c46 |
| `correlation_analysis` | df, features[], method | 상관행렬, 유의쌍, ρ/r + p-value | pandas/scipy · L10 c5 |
| `re_analysis` | 위 도구 + subset/filter params | MSAT 지정 조건으로 재실행 결과 | 위 전부 |

프론트 데모 안정성을 위해 무거운 도구(`automl` time_limit≥600s, `feature_selection` num_runs=10)는 **seed 모드에서 사전 계산 캐시**를 사용하고, live 모드에서는 축소 파라미터(예: AutoML 60~120s, SHAP runs=3)로 실행한다.

### 6.2 Output Contracts

**(a) AutoML**
```json
{
  "tool": "automl",
  "framework": "autogluon",
  "target": "[harvest][Harvest] Product. Yield",
  "n_samples": 128, "n_features_in": 412,
  "evidence": {
    "leaderboard": [
      {"model": "WeightedEnsemble_L2", "rmse": 2.77, "fit_time_s": 41.2},
      {"model": "LightGBM",            "rmse": 3.01, "fit_time_s": 5.4},
      {"model": "NN_TORCH",            "rmse": 3.44, "fit_time_s": 22.8}
    ],
    "best_model": "WeightedEnsemble_L2",
    "test_metrics": {"rmse": 2.77, "r2": 0.61, "mae": 2.10}
  },
  "interpretation": null
}
```

**(b) Feature Selection (앙상블 + 집계)**
```json
{
  "tool": "feature_selection",
  "target": "DSP_Final_Protein (g)",
  "evidence": {
    "num_selected": 20,
    "by_method": {
      "shap_xgb":  ["CEO Load Protein (g)", "AEO Pool Prot (g)", "..."],
      "shap_lgb":  ["..."], "lasso": ["..."], "mutual_info": ["..."],
      "boruta":    ["..."], "pca_topload": ["..."]
    },
    "aggregated_rank": [
      {"feature": "CEO Load Protein (g)", "score": 9.4, "methods_hit": 5},
      {"feature": "AEO Pool Prot (g)",    "score": 8.1, "methods_hit": 4}
    ],
    "overlap": {"shap_and_mi": 12, "shap_and_lasso": 9}
  },
  "interpretation": null
}
```

**(c) SHAP / XAI**
```json
{
  "tool": "shap_analysis",
  "model": "xgboost",
  "target": "[harvest][Harvest] Product. Yield",
  "n_samples": 128, "shap_runs": 10,
  "evidence": {
    "base_value": 78.4,
    "top_features": [
      {"feature": "[prd_final]VCD_BI",        "mean_abs_shap": 0.184, "direction": "negative", "shap_std": 0.021},
      {"feature": "[Production]O2_supply_slope","mean_abs_shap": 0.121, "direction": "positive", "shap_std": 0.014},
      {"feature": "[media_prep][Media B] Osmo","mean_abs_shap": 0.097, "direction": "positive", "shap_std": 0.010}
    ],
    "beeswarm_ref": "artifact://run/{id}/shap_beeswarm.json",
    "dependence_available": ["[prd_final]VCD_BI", "[Production]O2_supply_slope"]
  },
  "interpretation": null
}
```

**(d) Statistical Test**
```json
{
  "tool": "statistical_test",
  "feature": "[prd_final]VCD_BI",
  "group_rule": "median_split",
  "evidence": {
    "test": "welch_t", "statistic": 3.12, "p_value": 0.0031,
    "groups": {
      "high": {"n": 64, "yield_mean": 79.8, "yield_std": 2.1},
      "low":  {"n": 64, "yield_mean": 72.1, "yield_std": 3.4}
    }
  },
  "interpretation": null
}
```

- **모든 도구 출력의 `interpretation` 필드는 항상 `null`.** pydantic 스키마 검증 단계에서 non-null이면 예외를 던져 계약 위반을 원천 차단한다.
- 시각화용 대용량 배열(beeswarm 좌표 등)은 인라인이 아니라 `artifact://` 참조로 반환해 이벤트 스트림을 가볍게 유지한다.

---

## 7. MSAT Agent (Claude + RAG)

### 7.1 Responsibilities

1. **Interpret** — Analysis 증거를 공정 언어로 번역.
2. **Explain process meaning** — 왜 그 feature가 yield에 영향을 주는가.
3. **Search SOP / KB** — RAG로 관련 문서 검색 후 **인용**.
4. **Search historical batches** — Historical Batch Report에서 유사 사례 참조.
5. **Decide next investigation** — 다음에 볼 feature/조건/도구 결정.
6. **Request another iteration** — 구조화된 `next_action`으로 Analysis Agent 재호출 or 종료 선언.

### 7.2 Output Contract (예시)

```json
{
  "iteration": 1,
  "interpretation": "SHAP 상위 feature인 bioreactor_pH가 음의 방향으로 yield에 기여...",
  "citations": [
    {"doc": "CPP-CQA Matrix", "section": "pH ↔ Final Yield", "quote": "..."},
    {"doc": "Process Control Strategy", "section": "pH deadband", "quote": "..."}
  ],
  "hypothesis": "Day 3~4 pH가 6.9 상한을 넘는 배치에서 yield 저하가 집중된다.",
  "confidence": "medium",
  "next_action": {
    "type": "re_analysis",              // "re_analysis" | "stop"
    "tool": "statistical_test",
    "params": {"feature": "bioreactor_pH", "group_by": "pH > 6.9"},
    "rationale": "가설을 통계적으로 검정하기 위해 pH 6.9 기준 그룹 비교."
  }
}
```

### 7.3 RAG 설계

- **Chunking**: 문서를 섹션 단위(H2/H3)로 청킹.
- **Store**: 소규모 → 인메모리 벡터스토어(예: FAISS or numpy cosine) + 원문 캐시. 임베딩은 로컬/저비용 옵션 선택 가능.
- **Retrieval**: MSAT가 만든 쿼리로 top-k 청크 검색 → 프롬프트에 인용 후보로 주입.
- **Citation 강제**: 프롬프트에서 "문서 근거 없는 주장 금지, 반드시 citations 배열 채우기" 규칙.

---

## 8. Knowledge Base (CDMO 문서)

실제 고객 process transfer 문서처럼 느껴지도록 현실적인 가상 문서를 작성한다. 강의 데이터가 **mAb CDMO 공정 (USP 세포배양 → Harvest → DSP CEX/AEX 정제)** 이므로, 문서도 이 공정과 feature 명명 규칙(부록 C)에 **정합**하도록 작성한다.

| # | Document | 내용 요지 (실제 feature와 연결) |
|---|---|---|
| 1 | Process Overview | 공정 흐름: seed flask → media prep(A/B/C) → production bioreactor → harvest(centrifuge/filter) → DSP(CEX→AEX) |
| 2 | Process Parameter Guide | 파라미터 정의/단위/정상범위: VCD, Viability, pH, pCO2, DO, Osmo, Gln/Gluc, O2 supply, Titer, Load/Pool Conc·Prot |
| 3 | CPP-CQA Matrix | CPP ↔ CQA 매핑: `[Production]DO_Stab`·`[prd_final]VCD_BI` → Titer/Yield, `CEO/AEO Load·Pool` → DSP Final Protein |
| 4 | Golden Batch Criteria | Golden batch 판정: Product. Yield / DSP_Final_Protein (g) / Titer 기준선 및 판정 규칙 |
| 5 | Historical Batch Report | 과거 배치 요약(고수율/저수율 batch, 이탈 사유), `Batch_No` 단위 |
| 6 | Troubleshooting Guide | 증상 → 원인 → 조치: over-feeding, DO 불안정, chromatography load ratio 이탈 등 |
| 7 | SME Notes | 현장 경험칙(예: seed VCD가 높으면 production lag 감소, AEO hold time 영향) |
| 8 | Process Control Strategy | deadband/알람 한계/제어 로직 (pH, DO_Stab, 온도 shift, feed 전략) |
| 9 | Statistical Interpretation Guide | mean\|SHAP\| · p-value · CV RMSE를 공정 판단으로 연결하는 사내 가이드 |
| 10 | Golden Batch Report | 이전 golden batch 분석 리포트(모범 사례, 권고 파라미터 window) |

- 형식: Markdown, 섹션 헤더 명확히(RAG 청킹 친화적).
- 데이터 일관성: 시드 CSV의 컬럼/값 범위와 문서의 파라미터가 **정합**하도록 작성.

---

## 9. Iteration Loop Protocol

### 9.1 State Machine

```
START
  → [Analysis Agent] 초기 분석 (yield_prediction + feature_importance + shap)
  → [MSAT Agent] 해석 + hypothesis + next_action
  → next_action == "stop"?  ── yes ─→ FINAL RECOMMENDATION → END
        │ no
        ▼
  → iteration++ ; iteration > max_iteration? ── yes ─→ FINAL (forced) → END
        │ no
        ▼
  → [Analysis Agent] re_analysis(next_action.tool, params)
  → [MSAT Agent] 재해석 ... (loop)
```

### 9.2 Stopping Conditions

루프는 다음 중 하나라도 만족하면 종료:

1. MSAT가 `next_action.type == "stop"` 선언 (충분한 확신).
2. `iteration >= max_iteration` (사용자 지정 상한).
3. **가설 수렴** — 연속 2회 hypothesis가 실질적으로 동일(변화 없음).
4. **에러/타임아웃** — 안전장치.

### 9.3 Final Recommendation

종료 시 MSAT가 다음을 요약:
- 최종 가설 및 근거(문서 인용 포함)
- Golden Batch를 위한 **권고 파라미터 조건**
- 남은 불확실성 / 추가로 필요한 데이터

---

## 10. UI Specification

### 10.1 레이아웃 (SPA, 단일 화면)

```
┌────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                         │
│  [Upload CSV] [☐ Demo dataset] [Model ▾] [Max Iteration ▾] [Run]│
├───────────────┬───────────────────────────┬────────────────────┤
│ LEFT          │ RIGHT-TOP                 │                    │
│ Agent         │ Current Hypothesis        │                    │
│ Conversation  │  - hypothesis text        │                    │
│               │  - confidence badge       │                    │
│ (스트리밍       │  - citations (문서 링크)   │                    │
│  대화 버블:     │  - next action           │                    │
│  🧮 Analysis   ├───────────────────────────┤                    │
│  🧠 MSAT)      │ RIGHT-BOTTOM (optional)   │                    │
│               │  Evidence panel           │                    │
│               │  (SHAP chart, stats table)│                    │
├───────────────┴───────────────────────────┴────────────────────┤
│  BOTTOM — Iteration Timeline                                    │
│  [Iter 1]──[Iter 2]──[Iter 3]── ... ──[Final]                   │
│   각 노드 클릭 시 해당 iteration 상세로 스크롤/필터              │
└────────────────────────────────────────────────────────────────┘
```

### 10.2 상호작용

- **Top**: CSV 업로드 or Demo dataset 체크. Model(XGBoost 등), Max Iteration(1~10). Run 클릭 → 스트림 시작.
- **Left (Agent Conversation)**: Analysis(🧮)와 MSAT(🧠) 메시지가 시간순 버블로. Analysis 버블엔 증거 요약/차트, MSAT 버블엔 해석/인용.
- **Right (Current Hypothesis)**: 항상 "지금 가설"을 크게. iteration 진행에 따라 갱신되며, 변경 diff를 강조.
- **Bottom (Iteration Timeline)**: 진행 상황을 노드로. 완료/진행중/대기 상태 색상. 클릭 시 해당 iteration으로 이동.
- **스트리밍**: SSE(또는 WebSocket)로 단계별 이벤트 push → 관객이 "생각의 흐름"을 실시간 관람.

### 10.3 Event Types (Frontend가 구독)

```
run.started        { runId, model, maxIter, dataset }
analysis.started   { iteration, tool }
analysis.result    { iteration, tool, evidence, charts }
msat.started       { iteration }
msat.token         { iteration, delta }        // 토큰 스트리밍(옵션)
msat.result        { iteration, interpretation, hypothesis, citations, next_action }
iteration.completed{ iteration }
run.finished       { finalRecommendation }
error              { stage, message }
```

### 10.4 Design System (shared, product-agnostic)

이 앱의 UI는 **별도 저장소의 공유 디자인 시스템**을 준수한다. 같은 시스템을 자매
제품 **Deviation Review**도 채택하여, 배포는 분리되어도 룩앤필은 하나로 통일된다.

- 정본: [`design-system/DESIGN_SYSTEM.md`](./design-system/DESIGN_SYSTEM.md) (명세)
- 토큰: [`design-system/tokens.css`](./design-system/tokens.css) (CSS 변수, 프레임워크 무관) · [`tokens.json`](./design-system/tokens.json) (기계 판독 미러)
- **원칙:** 제품은 hex를 하드코딩하지 않고 `var(--ds-*)`만 참조. 제품 고유 의미는
  **generic role slot**(`--ds-accent-1..4`)에 매핑한다. (Golden Batch: accent-1=Analysis, accent-2=MSAT)
- **채택:** `tokens.css`를 앱 루트에서 import (본 앱은 `frontend/app/globals.css`),
  Tailwind는 색을 CSS 변수로 브리지(`frontend/tailwind.config.ts`).
- **버전:** DS는 SemVer(`--ds-version`). 각 제품은 목표 DS 버전을 명시하고 의도적으로 업그레이드.
- **거버넌스:** 두 제품 모두에 이로운 변경만 DS로 승격. 제품 고유 스타일은 토큰
  *위에서* 제품이 직접 구성(‑ DS에 추가하지 않음).

> 상태: 본 앱은 DS v1.0.0 준수(토큰 배선 완료, 다크 테마는 M6에서 컴포넌트 토큰 마이그레이션 후 활성).

---

## 11. Data Contracts & Schemas

### 11.1 Run 시작 요청

```
POST /api/runs
{
  "dataset": "seed" | "<uploaded-file-id>",
  "target": "[harvest][Harvest] Product. Yield",   // 또는 "DSP_Final_Protein (g)"
  "automl_framework": "autogluon",                  // "autogluon" | "h2o"
  "max_iteration": 4,
  "time_budget_s": 120                              // AutoML/SHAP 시간 예산
}
→ { "runId": "..." }  ; then GET /api/runs/{runId}/events (SSE)
```

### 11.2 CSV 스키마 (실제 강의 데이터 기준)

실제 데이터는 **batch(행) × feature(열)** wide table. 컬럼은 `[stage][substage]Parameter_stat` 명명 규칙(부록 C)을 따르며, 수백 개(예: USP ~수백, DSP 크로마토그래피 online feature 다수)에 이른다.

| 구분 | 컬럼 예시 | type | 설명 |
|---|---|---|---|
| ID | `Batch_No` | str/int | 배치 식별자 (feature에서 항상 제외) |
| USP-seed | `[flask_filtered][flask]125mL_Final VCD` | float | seed flask 최종 VCD |
| USP-media | `[media_prep][media][Media B] Osmo` | float | Media B osmolality |
| USP-prod | `[prd_final]VCD_BI`, `[prd_final]pH_BI`, `[prd_final]Gln_BI` | float | production bioreactor 지표 |
| USP-prod(signal) | `[Production]O2_supply_slope`, `[Production]DO_Stab_Avg` | float | 공정 신호 통계(slope/mean/std…) |
| USP-harvest | `[harvest]Centrifuge_Bowl_Speed_mean`, `[harvest]Diff_Press_Final_Filter_std` | float | harvest centrifuge/filter |
| DSP-batch | `CEO Load Protein (g)`, `AEO Pool Prot (g)`, `AEO Hold Time (hr)` | float | 크로마토 load/pool/hold |
| DSP-online | `Cycle2_Block Chase2_AEO__Cycle2__Cond_101__val_mean` | float | 크로마토 online 신호 통계 |
| **target** | `[harvest][Harvest] Product. Yield` | float | USP 수율 (g) |
| **target(대체)** | `DSP_Final_Protein (g)` | float | DSP 최종 단백질 (g) |
| 라벨(옵션) | `Normalized Titer by 1000` | float | Titer(참고 CQA) |

- 업로드 CSV는 최소한 `target` 컬럼 1개 + 수치형 feature들을 요구. `Batch_No`/범주형은 자동 처리(부록 C의 전처리 규칙).
- 스키마 검증: target 존재 확인, 수치형 feature ≥ N개, 결측/inf 리포트 → 친절한 에러 메시지.

> ⚠️ **데이터 파일 확보 필요:** 현재 리포에는 노트북만 있고 실제 CSV(`final_usp_features.csv`, `merged_y_all.csv` 등)는 없다. 시드 데이터셋은 (a) 강의용 실제 CSV를 리포에 포함하거나, (b) 부록 C 스키마·값 범위에 맞춰 합성 생성한다. (M1에서 결정 — Open Question 6)

---

## 12. Tech Stack

| Layer | 선택 | 비고 |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript** | SPA, SSE 구독, 차트(Recharts/visx) |
| Styling | Tailwind CSS | 빠른 3-패널 레이아웃 |
| Backend | **FastAPI (Python)** | ML 실행 + 오케스트레이션 + SSE |
| ML-core | pandas, numpy, scikit-learn, scipy | 전처리·통계·CV |
| ML-model | xgboost, lightgbm, catboost | model_compare / SHAP |
| AutoML | **AutoGluon** (기본), H2O AutoML (옵션) | `automl` 도구. H2O는 JVM 필요 |
| XAI | shap (TreeExplainer) | SHAP global/beeswarm/dependence |
| Feature Sel. | Boruta(BorutaPy), sklearn(Lasso/MutualInfo/PCA) | `feature_selection` 앙상블 |
| Tuning | Optuna | `hyperparameter_tune` |
| LLM | **Anthropic Claude API** (`claude-opus-4-8` / `claude-sonnet-5`) | MSAT Agent. 키 보유(로컬 env) |
| RAG | 경량 인메모리 벡터스토어(FAISS or numpy cosine) | KB 규모 작음 |
| Streaming | SSE (기본) | 단순/방화벽 친화 |
| Config | `.env` (`ANTHROPIC_API_KEY`, `SEED_MODE`, `MODEL`) | 키는 커밋 금지 |

> 최신 Claude 모델 파라미터/가격/툴 사용은 구현 단계에서 `claude-api` 스킬로 재확인 후 확정.

---

## 13. Proposed Directory Structure

```
goldenbatchai/
├─ PRD.md                       ← (this file)
├─ README.md
├─ .env.example
├─ frontend/                    ← Next.js SPA
│  ├─ app/
│  │  └─ page.tsx               ← 단일 화면 (3-panel)
│  ├─ components/
│  │  ├─ TopBar.tsx
│  │  ├─ AgentConversation.tsx
│  │  ├─ HypothesisPanel.tsx
│  │  ├─ EvidencePanel.tsx      ← SHAP/stat 차트
│  │  └─ IterationTimeline.tsx
│  └─ lib/eventStream.ts        ← SSE 클라이언트
├─ backend/                     ← FastAPI
│  ├─ main.py                   ← 라우트, SSE
│  ├─ orchestrator.py           ← iteration state machine
│  ├─ agents/
│  │  ├─ analysis_agent.py      ← ML 도구들
│  │  └─ msat_agent.py          ← Claude + RAG
│  ├─ rag/
│  │  ├─ store.py               ← 임베딩/검색
│  │  └─ ingest.py              ← KB 청킹/인덱싱
│  ├─ schemas.py                ← pydantic 계약(증거/해석)
│  └─ tools/                    ← yield/shap/stat/corr
├─ knowledge_base/              ← CDMO 문서 10종 (Markdown)
│  ├─ 01_process_overview.md
│  ├─ 02_process_parameter_guide.md
│  ├─ 03_cpp_cqa_matrix.md
│  ├─ ...
│  └─ 10_golden_batch_report.md
└─ data/
   └─ golden_batch_demo.csv     ← 시드 데이터셋
```

---

## 14. Milestones (구현 순서 제안)

1. **M0 — 스캐폴딩**: 레포 구조, `.env.example`, frontend/backend 부팅, healthcheck.
2. **M1 — Knowledge Base**: CDMO 문서 10종 + 시드 CSV 작성 (상호 정합).
3. **M2 — Analysis Agent**: 도구 6종 구현 + 증거 스키마 검증(해석 금지 강제).
4. **M3 — RAG**: KB 청킹/인덱싱 + 검색.
5. **M4 — MSAT Agent**: Claude 호출 + 인용 강제 + `next_action` 구조화.
6. **M5 — Orchestrator**: iteration 루프 + stopping conditions + SSE 이벤트.
7. **M6 — Frontend**: 3-패널 + 타임라인 + 스트리밍 구독.
8. **M7 — Seed 시나리오 & 폴리시**: 데모 안정화, 캐시 폴백(옵션), 스토리텔링 카피.
9. **M8 — Demo Rehearsal**: 3+ iteration이 서로 다른 근거로 도는지 검증.

---

## 15. Risks & Mitigations

| Risk | 영향 | 완화 |
|---|---|---|
| Analysis Agent가 해석을 흘림 | 교육 메시지 훼손 | 스키마 강제 `interpretation=null`, 프롬프트/코드 이중 차단 |
| MSAT가 문서 없이 환각 | 신뢰도 저하 | RAG citation 강제, 근거 없으면 "unknown" 반환 규칙 |
| LLM 응답 불안정/느림 | 데모 리스크 | Seed 모드 + (옵션)응답 캐시, 타임아웃/재시도 |
| iteration이 매번 똑같음 | 교육 효과 없음 | 가설 diff 강조 + next_action 다양화 유도 프롬프트 |
| CSV 스키마 다양성 | 업로드 실패 | 명확한 스키마 검증 + 친절한 에러 + 시드 대안 |
| API 키 노출 | 보안 | `.env`(gitignore), 프론트에 키 절대 노출 금지(백엔드 경유) |

---

## 16. Open Questions

1. 임베딩 방식 — Anthropic엔 임베딩 API가 없으므로 RAG 임베딩을 (a) 로컬 sentence-transformers, (b) 타 임베딩 API, (c) 키워드/BM25 중 무엇으로? (KB가 작아 BM25로도 충분할 수 있음)
2. MSAT 모델 — `claude-opus-4-8`(품질) vs `claude-sonnet-5`(속도/비용) 중 데모 기본값?
3. 차트 라이브러리 — Recharts vs visx (SHAP beeswarm은 visx가 유리).
4. 토큰 스트리밍(글자 단위)까지 보여줄지, 단계 단위 이벤트로 충분한지.
5. Golden Batch 도메인 — 확정: **mAb CDMO (USP 세포배양 → Harvest → DSP CEX/AEX)**. (강의 데이터 기준)
6. **시드 데이터** — 실제 강의 CSV(`final_usp_features.csv`/`merged_y_all.csv`)를 리포에 포함할지, 아니면 부록 C 스키마로 합성할지? (권장: 발표엔 실제 CSV 1개, 배포/공유용은 합성)
7. AutoML 기본 프레임워크 — AutoGluon(설치 간단, pip) vs H2O(JVM 필요, leaderboard 강점). 데모 안정성 위해 AutoGluon 기본 권장.
8. 두 target(`Product. Yield` USP vs `DSP_Final_Protein` DSP) 중 데모 기본값? USP 단독 vs USP+DSP 통합 분석 시나리오.

---

## 17. Appendix A — Demo Narrative (예시 스크립트)

> ⚠️ 아래는 **개념 예시**다. 실제 feature 명명 규칙은 부록 C를 따르므로, M8에서 시드 데이터로 재현 시 `bioreactor_pH` → `[prd_final]pH_BI` 등 실제 컬럼으로 대체한다.

```
Iteration 1
  🧮 Analysis: yield_prediction(R²=0.62), feature_importance, shap
             → top: bioreactor_pH(-), feed_rate_day3(+), DO_setpoint(+)
  🧠 MSAT:    "pH가 음의 방향으로 가장 큰 기여. CPP-CQA Matrix상 pH는 CQA(yield)의 CPP.
              가설: Day3~4 pH 상한 초과 배치에서 yield 저하."
             → next: statistical_test(pH > 6.9 그룹 비교)

Iteration 2
  🧮 Analysis: t-test → high-pH군 yield 평균 72.1 vs 79.8, p=0.003
  🧠 MSAT:    "가설 지지. Process Control Strategy의 pH deadband(6.8±0.1)와 정합.
              단, feed_rate와의 상호작용 미확인."
             → next: correlation_analysis(pH × feed_rate_day3 × yield)

Iteration 3
  🧮 Analysis: corr → pH↔feed_rate ρ=0.41, 둘 다 yield와 유의
  🧠 MSAT:    "pH 상승이 feed 과공급과 동반되는 배치에서 yield 저하가 심화.
              Troubleshooting Guide의 'over-feeding → pH drift' 패턴과 일치."
             → next: stop (확신 충분)

Final Recommendation
  🧠 MSAT: "Golden Batch 조건 — Day3~4 pH 6.7~6.9 유지 + feed_rate_day3 ≤ X.
           근거: CPP-CQA Matrix, Process Control Strategy, Troubleshooting Guide."
```

*(위 수치는 예시이며 실제 시드 데이터로 재현되도록 M8에서 튜닝.)*

---

## 18. Appendix B — 강의 노트북 → Analysis Agent 도구 매핑

리포의 노트북은 실제 분석에 쓰인 코드다. Analysis Agent 각 도구는 아래 셀 로직을 제품화한 것이다.

| 노트북 | 내용 | Analysis Agent 도구 |
|---|---|---|
| `Lecture7_AutoML.ipynb` | H2O AutoML + AutoGluon, target=`[harvest][Harvest] Product. Yield`, RMSE 평가 | `automl` |
| `Lecture10.ipynb` c5 | Spearman \|ρ\|>0.9 다중공선성 제거 (Batch_No/target 제외) | `remove_multicollinearity` |
| `Lecture10.ipynb` c6 | 전처리(label-encode, inf→NaN, median impute) + XGBoost×10run SHAP mean\|SHAP\| | `preprocess`, `shap_analysis` |
| `Lecture10.ipynb` c14-19 | feature selection: SHAP(XGB), SHAP(LGB), Lasso, MutualInfo, Boruta, PCA | `feature_selection` |
| `Lecture10.ipynb` c20-23 | 랭킹 집계(`aggregate_feature_ranks`, SHAP 가중), 방법 간 overlap | `feature_selection` (집계) |
| `Lecture10.ipynb` c24 | `find_optimal_feature_count` (k별 CV RMSE) | `optimal_feature_count` |
| `Lecture10.ipynb` c27-29 | RF/GBM/XGB/LGB 비교 + per-model SHAP + RMSE | `model_compare` |
| `Lecture10.ipynb` c31-32 | Optuna `objective_xgb` 50 trials → best_params → 5-fold CV | `hyperparameter_tune` |
| `Lecture10.ipynb` c45-50 | 저수율/outlier 분석, augmentation(model_no vs model_aug) | `re_analysis` (subset/augment) |
| `Lecture6.ipynb` c22-27 | permutation_importance, Boruta, GridSearch, `get_shap_graphs` | `shap_analysis`, `feature_selection` |
| `Lecture6.ipynb` c8-10 | XGB/LGB/CatBoost 개별 학습 + feature_importances_ | `model_compare` |
| `Lecture5_FPCA.ipynb` | 시계열 online → Functional PCA feature 추출 | (선택) 향후 `feature_engineering` 도구 |
| `Lecture5_Kalman_Filter.ipynb` | 9-state Kalman filter 상태 추정 | (선택) 향후 `feature_engineering` 도구 |

> **범위 주의:** MVP는 `Lecture7`(AutoML) + `Lecture10`(핵심 파이프라인) 중심. FPCA/Kalman(Lecture5)의 시계열 feature engineering은 이미 feature화된 CSV를 입력으로 받으므로 v1 범위 밖(향후 확장).

---

## 19. Appendix C — 실제 Feature 택소노미 (명명 규칙)

강의 데이터 컬럼은 `[stage][substage]Parameter_stat` 규칙을 따른다. MSAT Agent가 feature 이름을 공정 언어로 해석할 때 이 택소노미를 참조한다.

### C.1 Stage prefix

| Prefix | 공정 단계 | 예시 컬럼 |
|---|---|---|
| `[flask_filtered][flask]` | Seed flask (접종 확대) | `[flask_filtered][flask]125mL_Final VCD`, `..._Final Viability`, `..._weighted nCell` |
| `[media_prep][media][Media A/B/C]` | 배지 준비 | `[media_prep][media][Media B] Glucose_Conc`, `... Osmo`, `... pH-Final` |
| `[prd_final]` / `[prd_final][batch_prd]` | Production bioreactor (batch 요약) | `[prd_final]VCD_BI`, `pH_BI`, `Gln_BI`, `pCO2_BI`, `Normalized Titer by 1000_*`, `Osm_*`, `Age_*` |
| `[Production]` | Production 공정 신호(시계열 통계) | `[Production]DO_Stab_Avg`, `[Production]O2_supply_slope`, `[Production]Temp_First`, `[Production]Top_Air_Flow_mean` |
| `[harvest]` | Harvest (원심분리/여과) | `[harvest]Centrifuge_Bowl_Speed_mean`, `[harvest]Diff_Press_Final_Filter_std`, `[harvest][Harvest] Product. Yield`(target) |
| `CEO ...` | DSP: Cation Exchange 크로마토(batch) | `CEO Load Protein (g)`, `CEO Load Cond (mS/cm)`, `CEO Pool Vol. (kg)` |
| `AEO ...` | DSP: Anion Exchange 크로마토(batch) | `AEO Load Conc. (g/L)`, `AEO Pool Prot (g)`, `AEO Hold Time (hr)` |
| `CycleN_Block <B>_AEO__CycleN__<Signal>_<tag>__val_<stat>` | DSP 크로마토 online 신호 | `Cycle2_Block Chase2_AEO__Cycle2__Cond_101__val_mean`, `..._Press_112__val_std` |

### C.2 통계 suffix (시계열 → batch 요약 방식)

`mean · max · min · std · first · last · slope · sum · rate · duration_hr · StabTime_hr · _weighted · _BI(baseline/initial) · _0.._N(시점/day 인덱스)`

- 예: `[Production]O2_supply_slope` = production 중 O2 공급량의 시간 기울기, `[prd_final]VCD_BI` = production 초기(baseline) VCD.
- MSAT는 이 suffix로 "언제/어떤 동역학"을 해석한다 (예: `slope>0`이면 증가 추세).

### C.3 DSP online 신호(`<Signal>_<tag>`)

| Signal | 의미 | tag 예 |
|---|---|---|
| `Cond` | Conductivity (mS/cm) | 101, 102 |
| `Flow` | Flow rate | 141 |
| `Press` | Pressure | 111, 112 |
| `Temp` | Temperature | 101, 102 |
| `pH` | pH | 121 |
| `ProgGrad` / `RunGrad` | Program/Run gradient | — |
| `FilterDP` | Filter differential pressure | — |
| `CV_length` | Column Volume 관련 길이 | — |

### C.4 Targets & CQA

| 컬럼 | 역할 | 단계 |
|---|---|---|
| `[harvest][Harvest] Product. Yield` | **1차 target** (USP 수율, g) | Harvest |
| `[harvest][batch_harvest][Harvest] Vol. Yield` | 부피 수율 | Harvest |
| `DSP_Final_Protein (g)` | **DSP target** (최종 단백질) | DSP 종료 |
| `Normalized Titer by 1000` | Titer (CQA, 참고) | Production |
| `Batch_No` | ID (feature 제외) | — |
