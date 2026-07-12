// Explainer notes for every analysis method in the pipeline. Rendered in the
// "method notes" popup; the `formula` line is highlighted in mint by the modal.

export interface MethodNote {
  key: string;
  name: string;
  formula: string;
  en: { what: string; read: string };
  ko: { what: string; read: string };
}

export const METHOD_NOTES: MethodNote[] = [
  {
    key: "automl",
    name: "AutoML leaderboard",
    formula: "RMSE = √( (1/n) Σ (yᵢ − ŷᵢ)² )   ·   R² = 1 − SS_res / SS_tot",
    en: {
      what: "Trains several models (RandomForest, GradientBoosting, XGBoost, LightGBM) with cross-validation and ranks them by error.",
      read: "Lower RMSE = better fit; R² near 1 = the model explains most of the yield variance. The top model is used for the SHAP step.",
    },
    ko: {
      what: "여러 모델(RandomForest·GradientBoosting·XGBoost·LightGBM)을 cross-validation으로 학습해 error 기준으로 순위를 매깁니다.",
      read: "RMSE가 낮을수록 fit이 좋고, R²가 1에 가까울수록 yield 분산을 잘 설명합니다. 1위 모델이 SHAP 단계에 쓰입니다.",
    },
  },
  {
    key: "shap_analysis",
    name: "SHAP importance",
    formula: "φᵢ = Σ_{S⊆F\\{i}} [ |S|!(|F|−|S|−1)! / |F|! ] · ( f(S∪{i}) − f(S) )",
    en: {
      what: "SHAP assigns each feature a Shapley value — its fair contribution to a single prediction, averaged over all feature orderings.",
      read: "Importance = mean(|SHAP|) across batches. Direction (positive/negative) shows whether higher values of the feature raise or lower yield.",
    },
    ko: {
      what: "SHAP는 각 feature에 Shapley value(모든 순서를 고려한 공정한 기여도)를 부여합니다.",
      read: "중요도는 batch 전체의 mean(|SHAP|)입니다. 방향(양/음)은 feature 값이 커질 때 yield가 올라가는지 내려가는지를 뜻합니다. 예: DO 값이 줄어듦에 따라 yield가 낮아지면 negative.",
    },
  },
  {
    key: "feature_selection",
    name: "Feature selection (ensemble)",
    formula: "score(f) = Σ_methods  w · (N − rankₘ(f))     w: SHAP=2, Lasso=1, MI=1",
    en: {
      what: "Combines four rankings — SHAP(XGB), SHAP(LGB), Lasso |coef|, and mutual information — into one weighted vote.",
      read: "Features hit by more methods and ranked higher get a larger score. 'methods_hit' shows how many of the four agreed.",
    },
    ko: {
      what: "네 가지 순위 — SHAP(XGB)·SHAP(LGB)·Lasso |계수|·mutual information — 를 가중 투표로 합칩니다.",
      read: "여러 기법에서 상위로 뽑힌 feature일수록 score가 큽니다. 'methods_hit'은 네 기법 중 몇 개가 동의했는지입니다.",
    },
  },
  {
    key: "model_compare",
    name: "Model comparison",
    formula: "per model:  CV RMSE ± std ,  R² ,  top mean(|SHAP|) features",
    en: {
      what: "Runs every model side by side with the same CV split and lists each model's error plus its own top SHAP features.",
      read: "Use it to check that different model families agree on the important drivers — agreement means the signal is robust, not model-specific.",
    },
    ko: {
      what: "모든 모델을 같은 CV 분할로 나란히 돌려 각 모델의 error와 자체 SHAP 상위 feature를 보여줍니다.",
      read: "서로 다른 모델 계열이 같은 주요 driver에 동의하는지 확인하는 용도입니다. 동의할수록 신호가 모델에 의존하지 않고 robust합니다.",
    },
  },
  {
    key: "statistical_test",
    name: "Welch t-test (group difference)",
    formula: "t = (x̄₁ − x̄₂) / √( s₁²/n₁ + s₂²/n₂ )   →   p ;  significant if p < α",
    en: {
      what: "Splits batches into two groups (e.g. pH > 6.9 vs not) and tests whether their mean yield differs. Welch's version does not assume equal variance.",
      read: "p < α (default 0.05) means the difference is unlikely to be chance. The group means show the size and direction of the effect.",
    },
    ko: {
      what: "batch를 두 그룹(예: pH > 6.9 vs 이하)으로 나눠 평균 yield 차이를 검정합니다. Welch 방식은 분산이 같다고 가정하지 않습니다.",
      read: "p < α(기본 0.05)이면 그 차이가 우연일 가능성이 낮다는 뜻입니다. 그룹 평균은 효과의 크기와 방향을 보여줍니다.",
    },
  },
  {
    key: "correlation_analysis",
    name: "Correlation (Spearman / Pearson)",
    formula: "Spearman ρ = 1 − 6Σd² / (n(n²−1))    ·    Pearson r = cov(X,Y) / (σ_X σ_Y)",
    en: {
      what: "Measures how strongly each feature moves with yield. Spearman uses ranks (monotonic), Pearson uses raw values (linear).",
      read: "r (or ρ) runs from −1 to +1: sign = direction, magnitude = strength. p < α flags associations unlikely to be noise.",
    },
    ko: {
      what: "각 feature가 yield와 얼마나 함께 움직이는지 측정합니다. Spearman은 순위(단조), Pearson은 원값(선형) 기반입니다.",
      read: "r(또는 ρ)은 −1~+1 범위로 부호는 방향, 크기는 강도입니다. p < α이면 우연으로 보기 어려운 연관입니다.",
    },
  },
  {
    key: "remove_multicollinearity",
    name: "Multicollinearity removal",
    formula: "drop feature f if  max_{g≠f} |corr(f, g)| > threshold  (default 0.9)",
    en: {
      what: "Finds pairs of features that carry nearly the same information (high mutual correlation) and drops the redundant ones.",
      read: "Removing collinear features stabilizes coefficients and SHAP attributions so credit isn't split between duplicate signals.",
    },
    ko: {
      what: "거의 같은 정보를 담은 feature 쌍(상호 상관이 높은)을 찾아 중복을 제거합니다.",
      read: "공선성 feature를 제거하면 계수와 SHAP 기여가 안정되어, 중복 신호끼리 기여도가 분산되는 문제를 막습니다.",
    },
  },
];
