import * as Icons from "./Icons";

// Category icon mapping
const CAT_ICON_MAP = {
  "文章作成・要約": Icons.Pen,
  "文書校正・編集": Icons.FileCheck,
  "アイデア創出・企画": Icons.Lightbulb,
  "業務改善": Icons.Wrench,
  "情報収集・分析": Icons.BarChart,
  "コミュニケーション支援": Icons.MessageCircle,
  "プログラミング": Icons.Code,
  "意識改革・スキルアップ": Icons.TrendingUp,
  "その他": Icons.TagIcon,
};
const CatIcon = ({ cat }) => { const Icon = CAT_ICON_MAP[cat]; return Icon ? <span className="cat-icon"><Icon /></span> : null; };

export default CatIcon;
