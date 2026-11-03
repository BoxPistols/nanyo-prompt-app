const CAT_COLORS = {
  "文章作成・要約": { bg: "#e0f2fe", fg: "#0369a1", darkBg: "rgba(3, 105, 161, 0.25)", darkFg: "#7dd3fc" },
  "文書校正・編集": { bg: "#fce7f3", fg: "#be185d", darkBg: "rgba(190, 24, 93, 0.25)", darkFg: "#f9a8d4" },
  "アイデア創出・企画": { bg: "#fffbeb", fg: "#b45309", darkBg: "rgba(180, 83, 9, 0.25)", darkFg: "#fcd34d" },
  "業務改善": { bg: "#dcfce7", fg: "#15803d", darkBg: "rgba(21, 128, 61, 0.25)", darkFg: "#86efac" },
  "情報収集・分析": { bg: "#e0e7ff", fg: "#4338ca", darkBg: "rgba(67, 56, 202, 0.25)", darkFg: "#a5b4fc" },
  "コミュニケーション支援": { bg: "#f3e8ff", fg: "#7e22ce", darkBg: "rgba(126, 34, 206, 0.25)", darkFg: "#d8b4fe" },
  "プログラミング": { bg: "#cffafe", fg: "#0e7490", darkBg: "rgba(14, 116, 144, 0.25)", darkFg: "#67e8f9" },
  "意識改革・スキルアップ": { bg: "#ffedd5", fg: "#c2410c", darkBg: "rgba(194, 65, 12, 0.25)", darkFg: "#fdba74" },
  "その他": { bg: "#f1f5f9", fg: "#475569", darkBg: "rgba(71, 85, 105, 0.25)", darkFg: "#cbd5e1" },
};

export const getColor = (c1, isDark) => {
  const cfg = CAT_COLORS[c1] || CAT_COLORS["その他"];
  return isDark ? { bg: cfg.darkBg, fg: cfg.darkFg } : cfg;
};
