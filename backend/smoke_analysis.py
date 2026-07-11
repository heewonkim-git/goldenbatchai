"""Quick M2 smoke test: run the real Analysis tools on the seed dataset."""
from tools import dataset
from agents import analysis_agent as A

TARGET = "[harvest][Harvest] Product. Yield"
df = dataset.load_dataset("seed")
X, y = dataset.prepare_xy(df, TARGET)
print(f"data: {df.shape}  features_used: {X.shape[1]}  y mean={y.mean():.1f}")

sh = A.run_tool("shap_analysis", df, TARGET, {"runs": 3})
print("\nSHAP top-5:")
for f in sh.evidence["top_features"][:5]:
    print(f"  {f['mean_abs_shap']:.4f} {f['direction']:8} {f['feature']}")

am = A.run_tool("automl", df, TARGET)
print("\nleaderboard:", [(m["model"], m["rmse"]) for m in am.evidence["leaderboard"]])

fs = A.run_tool("feature_selection", df, TARGET, {"num_selected": 12})
print("agg top-5:", [r["feature"] for r in fs.evidence["aggregated_rank"][:5]])

st = A.run_tool("statistical_test", df, TARGET,
                {"feature": "[prd_final]pH_BI", "group_rule": "threshold", "threshold": 6.9})
print("\npH>6.9 test:", st.evidence["groups"], "p=", st.evidence["p_value"])

mc = A.run_tool("remove_multicollinearity", df, TARGET, {"threshold": 0.9})
print("collinearity dropped:", mc.evidence["dropped"])
print("\nOK - interpretation is None on all:",
      all(getattr(e, "interpretation", 1) is None for e in [sh, am, fs, st, mc]))
