/** 問題の報告の理由(ブラウザとサーバーの両方で使う) */
export const REPORT_REASONS = [
  { id: "spam", label: "スパム・宣伝" },
  { id: "inappropriate", label: "不適切な内容" },
  { id: "rights", label: "権利の侵害(無断転載など)" },
  { id: "other", label: "その他" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];
