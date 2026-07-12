// Lightweight EN/KO strings for the UI chrome. Agent-generated content (MSAT
// interpretation / hypothesis / next action) is localized by the backend, which
// returns *_ko fields; this table only covers static labels.

export type Lang = "en" | "ko";

type Dict = Record<string, string>;

const EN: Dict = {
  conv_title: "Agent Conversation · live work",
  conv_empty: "Press Run to start the agent iteration.",
  hypo_title: "Hypothesis Flow · reviewer view",
  hypo_empty: "As iterations run, each iteration's hypothesis and how it evolves stacks up here.",
  reference: "Reference:",
  final: "★ Final",
  iteration: "Iteration",
  via: "via",
  next: "next",
  stop_reco: "stop — recommendation issued",
  conf_low: "low",
  conf_medium: "medium",
  conf_high: "high",
  act_starting: "Starting…",
  act_analysis: "Analysis · {tool}…",
  act_msat: "MSAT retrieving docs & interpreting…",
  notes_title: "Statistical methods — notes",
  notes_btn: "Method notes",
  notes_intro: "Quick reference for every analysis in the pipeline. Formulas in mint.",
  settings_title: "Agent Settings",
};

const KO: Dict = {
  conv_title: "에이전트 대화 · 실시간",
  conv_empty: "Run을 눌러 에이전트 반복을 시작하세요.",
  hypo_title: "가설 흐름 · 리뷰어 뷰",
  hypo_empty: "반복이 진행되며 각 iteration의 가설이 어떻게 진화하는지 여기에 쌓입니다.",
  reference: "참고 문서:",
  final: "★ 최종",
  iteration: "Iteration",
  via: "기반",
  next: "다음",
  stop_reco: "stop — 권고안 도출",
  conf_low: "낮음",
  conf_medium: "중간",
  conf_high: "높음",
  act_starting: "시작 중…",
  act_analysis: "분석 · {tool}…",
  act_msat: "MSAT 문서 검색·해석 중…",
  notes_title: "통계 기법 — 노트",
  notes_btn: "기법 설명",
  notes_intro: "파이프라인의 모든 분석 기법 요약입니다. 수식은 민트색으로 강조했습니다.",
  settings_title: "에이전트 설정",
};

const TABLES: Record<Lang, Dict> = { en: EN, ko: KO };

export function tr(lang: Lang, key: string, vars?: Record<string, string>): string {
  let s = TABLES[lang]?.[key] ?? EN[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
