/**
 * キーワード検索ロジック
 * - キーワード検索: 複数キーワードAND検索、全フィールド対象
 * - 意図検索: 同義語・関連語展開による意図理解
 * - 曖昧検索: N-gram類似度 + カタカナ/ひらがな正規化
 */

// ─── テキスト正規化 ──────────────────────────────────────────────────────────

/** カタカナをひらがなに変換 */
const katakanaToHiragana = (str) =>
  str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

/** 全角英数→半角、カタカナ→ひらがな、小文字化 */
const normalize = (str) => {
  if (!str) return "";
  let s = String(str);
  // 全角英数→半角
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  s = katakanaToHiragana(s);
  return s.toLowerCase().trim();
};

// ─── 意図検索用 同義語・関連語マップ ─────────────────────────────────────────

/**
 * 意図マップ: ユーザーが入力しそうなキーワード → 関連する検索語群
 * 検索クエリにこれらのキーワードが含まれると、関連語も検索対象に加える
 */
const INTENT_MAP = {
  // 文書作成系
  "メール": ["ビジネスメール", "メッセージ", "コミュニケーション", "メルマガ", "連絡", "返信", "挨拶"],
  "mail": ["ビジネスメール", "メッセージ", "コミュニケーション", "メルマガ"],
  "手紙": ["ビジネスメール", "メッセージ", "挨拶", "文書作成"],
  "書く": ["文章作成", "作成", "文書", "ライティング", "執筆"],
  "作る": ["作成", "生成", "企画", "制作"],
  "まとめ": ["要約", "整理", "集約", "サマリー", "まとめる"],
  "要約": ["要約", "まとめ", "整理", "サマリー", "短縮", "集約"],
  "議事録": ["会議", "要約", "まとめ", "記録", "ミーティング"],
  "会議": ["議事録", "ミーティング", "打ち合わせ", "会議録", "アジェンダ"],

  // 業務系
  "仕事": ["業務", "タスク", "効率", "改善", "プロセス"],
  "効率": ["業務改善", "効率化", "時短", "生産性", "自動化"],
  "改善": ["業務改善", "効率化", "最適化", "プロセス改善", "見直し"],
  "自動化": ["マクロ", "プログラム", "効率化", "業務改善", "RPA"],

  // 分析系
  "分析": ["データ分析", "統計", "調査", "リサーチ", "レポート", "情報収集"],
  "調べる": ["調査", "リサーチ", "情報収集", "分析", "検索"],
  "調査": ["リサーチ", "情報収集", "分析", "調べる", "レポート"],
  "データ": ["データ分析", "統計", "Excel", "集計", "グラフ"],

  // プレゼン・資料系
  "資料": ["プレゼンテーション", "ドキュメント", "レポート", "報告書", "スライド"],
  "プレゼン": ["プレゼンテーション", "スライド", "資料", "発表", "構成"],
  "報告": ["報告書", "レポート", "復命書", "ドキュメント", "文書作成"],
  "スライド": ["プレゼンテーション", "構成", "スライド設計", "資料"],

  // 企画・アイデア系
  "企画": ["企画", "アイデア", "提案", "立案", "プランニング", "イベント"],
  "アイデア": ["アイデア創出", "企画", "ブレスト", "発想", "創造"],
  "提案": ["企画", "提案書", "立案", "プランニング"],

  // コミュニケーション系
  "翻訳": ["翻訳", "英語", "外国語", "コミュニケーション", "多言語"],
  "英語": ["翻訳", "英文", "外国語", "English"],
  "挨拶": ["スピーチ", "メッセージ", "挨拶文", "祝辞"],
  "スピーチ": ["挨拶", "メッセージ", "スピーチ関連", "発表"],

  // 広報系
  "広報": ["広報", "PR", "プレスリリース", "SNS", "メルマガ", "情報発信"],
  "SNS": ["メルマガ", "広報", "PR", "ソーシャル", "情報発信", "コンテンツ"],
  "宣伝": ["広報", "PR", "マーケティング", "キャッチコピー", "プロモーション"],

  // プログラミング系
  "プログラム": ["プログラミング", "コード", "マクロ", "Excel", "開発"],
  "コード": ["プログラミング", "プログラム", "コーディング", "開発"],
  "Excel": ["Excel", "マクロ", "スプレッドシート", "データ", "集計", "VBA"],
  "マクロ": ["Excel", "VBA", "プログラム", "自動化"],

  // 教育・スキル系
  "研修": ["教育", "研修", "セミナー", "講座", "人材育成", "スキルアップ"],
  "教育": ["教育", "研修", "セミナー", "指導", "学習", "人材育成"],
  "学ぶ": ["学習", "教育", "スキルアップ", "研修", "勉強"],

  // 問題解決系
  "悩み": ["問題解決", "相談", "対策", "解決", "改善"],
  "問題": ["問題解決", "課題", "対策", "トラブル", "解決"],
  "対策": ["問題解決", "リスクマネジメント", "改善", "対応", "防止"],
  "クレーム": ["クレーム対応", "顧客対応", "苦情", "改善", "コミュニケーション"],

  // AI関連
  "AI": ["生成AI", "プロンプト", "ChatGPT", "人工知能"],
  "プロンプト": ["プロンプト作成", "プロンプト設計", "プロンプト改善", "生成AI"],

  // 校正系
  "校正": ["文書校正", "添削", "校正・編集", "チェック", "修正"],
  "チェック": ["校正", "確認", "レビュー", "検証", "品質"],
  "添削": ["校正", "修正", "編集", "改善", "チェック"],
};

/** クエリから意図を展開し、関連語を含む拡張キーワードセットを返す */
const expandIntent = (queryTokens) => {
  const expanded = new Set();
  queryTokens.forEach((token) => {
    expanded.add(token);
    // 正規化前のトークンでも検索
    const normToken = normalize(token);
    Object.entries(INTENT_MAP).forEach(([key, synonyms]) => {
      const normKey = normalize(key);
      if (normToken.includes(normKey) || normKey.includes(normToken)) {
        synonyms.forEach((s) => expanded.add(normalize(s)));
      }
    });
  });
  return [...expanded];
};

// ─── 曖昧検索 (Fuzzy Search) ────────────────────────────────────────────────

/** bigram集合を生成 */
const bigrams = (str) => {
  const s = normalize(str);
  if (s.length < 2) return new Set([s]);
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    set.add(s.substring(i, i + 2));
  }
  return set;
};

/** Dice係数によるbigram類似度 (0〜1) */
const bigramSimilarity = (a, b) => {
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((g) => { if (setB.has(g)) intersection++; });
  return (2 * intersection) / (setA.size + setB.size);
};

/** 部分文字列のbigram類似度: クエリが対象テキストの部分列とどれだけ近いかを計算 */
const partialBigramSimilarity = (query, text) => {
  const normQ = normalize(query);
  const normT = normalize(text);

  if (normT.includes(normQ)) return 1.0;
  if (normQ.length <= 1) return normT.includes(normQ) ? 1.0 : 0;

  // クエリと同じ長さのウィンドウをスライドして最大類似度を求める
  const windowSize = Math.min(normQ.length + 2, normT.length);
  let maxSim = 0;
  for (let i = 0; i <= normT.length - windowSize; i++) {
    const window = normT.substring(i, i + windowSize);
    const sim = bigramSimilarity(normQ, window);
    if (sim > maxSim) maxSim = sim;
  }
  // 全体比較も
  const wholeSim = bigramSimilarity(normQ, normT);
  return Math.max(maxSim, wholeSim);
};

// ─── スコアリング ────────────────────────────────────────────────────────────

/**
 * フィールド重み: 検索対象フィールドと重み付け
 * title が最も重要、次にc1, c2, c3 の順
 */
const FIELD_WEIGHTS = {
  title: 10,
  c1: 5,
  c2: 4,
  c3: 3,
  sub: 2,
  tag: 2,
  id: 1,
};

/**
 * プロンプト1件に対する検索スコアを計算
 * @param {Object} prompt - プロンプトオブジェクト
 * @param {string[]} tokens - 検索トークン (正規化済み)
 * @param {string} mode - "keyword" | "intent" | "fuzzy" | "smart"
 * @returns {{ score: number, matchType: string }} スコアとマッチタイプ
 */
const scorePrompt = (prompt, tokens, mode) => {
  let totalScore = 0;
  let matchType = "";

  const fields = {
    title: normalize(prompt.title),
    c1: normalize(prompt.c1),
    c2: normalize(prompt.c2 || ""),
    c3: normalize(prompt.c3 || ""),
    sub: normalize(prompt.sub || ""),
    tag: normalize(prompt.tag || ""),
    id: String(prompt.id),
  };

  // --- キーワード検索 (完全一致・部分一致) ---
  // keyword / smart モードのみ実行
  if (mode === "keyword" || mode === "smart") {
    let keywordScore = 0;
    let keywordMatched = 0;

    tokens.forEach((token) => {
      let tokenScore = 0;
      Object.entries(fields).forEach(([field, value]) => {
        if (!value) return;
        const weight = FIELD_WEIGHTS[field] || 1;
        if (value === token) {
          // 完全一致
          tokenScore += weight * 3;
        } else if (value.includes(token)) {
          // 部分一致
          tokenScore += weight * 2;
        }
      });
      if (tokenScore > 0) keywordMatched++;
      keywordScore += tokenScore;
    });

    // AND条件: 全トークンがマッチした場合にボーナス
    if (keywordMatched === tokens.length && tokens.length > 1) {
      keywordScore *= 1.5;
    }

    if (keywordScore > 0) {
      totalScore += keywordScore;
      matchType = "keyword";
    }
  }

  // --- 意図検索 (mode が intent または smart) ---
  if (mode === "intent" || mode === "smart") {
    const expandedTokens = expandIntent(tokens);
    let intentScore = 0;

    expandedTokens.forEach((eToken) => {
      // smart モードでは元のトークンは既にキーワードスコアでカウント済みなのでスキップ
      // intent モードでは元のトークンも意図スコアとしてカウントする
      if (mode === "smart" && tokens.includes(eToken)) return;

      Object.entries(fields).forEach(([field, value]) => {
        if (!value) return;
        const weight = FIELD_WEIGHTS[field] || 1;

        if (mode === "intent") {
          // intent モード: 元のキーワードと同等の重みでスコアリング
          if (value === eToken) {
            intentScore += weight * 3;
          } else if (value.includes(eToken)) {
            intentScore += weight * 2;
          }
        } else {
          // smart モード: 補助的スコア
          if (value.includes(eToken)) {
            intentScore += weight * 0.8;
          }
        }
      });
    });

    if (intentScore > 0 && totalScore === 0) {
      matchType = "intent";
    } else if (intentScore > 0) {
      matchType = matchType ? matchType + "+intent" : "intent";
    }
    totalScore += intentScore;
  }

  // --- 曖昧検索 (mode が fuzzy または smart) ---
  if (mode === "fuzzy" || mode === "smart") {
    // fuzzy 単独モード: 高めの重み・低めの閾値で広く拾う
    // smart モード: 補助的スコア
    const fuzzyThreshold = mode === "fuzzy" ? 0.3 : 0.5;
    const fuzzyMultiplier = mode === "fuzzy" ? 1.5 : 0.6;
    let fuzzyScore = 0;

    tokens.forEach((token) => {
      if (token.length < 2) return; // 1文字は曖昧検索しない
      Object.entries(fields).forEach(([field, value]) => {
        if (!value) return;
        const weight = FIELD_WEIGHTS[field] || 1;
        const sim = partialBigramSimilarity(token, value);
        if (sim >= fuzzyThreshold) {
          // 曖昧一致
          fuzzyScore += weight * sim * fuzzyMultiplier;
        }
      });
    });

    if (fuzzyScore > 0 && totalScore === 0) {
      matchType = "fuzzy";
    } else if (fuzzyScore > 0 && matchType && !matchType.includes("fuzzy")) {
      matchType += "+fuzzy";
    }
    totalScore += fuzzyScore;
  }

  return { score: totalScore, matchType };
};

// ─── メイン検索関数 ──────────────────────────────────────────────────────────

/**
 * 検索モード
 * - "keyword": キーワード完全/部分一致のみ
 * - "intent": キーワード + 意図展開
 * - "fuzzy": キーワード + 曖昧検索
 * - "smart": すべてを組み合わせたスマート検索 (デフォルト)
 */

/**
 * プロンプトリストを検索してスコア付き結果を返す
 * @param {Array} prompts - プロンプト配列
 * @param {string} query - 検索クエリ
 * @param {string} mode - 検索モード ("keyword" | "intent" | "fuzzy" | "smart")
 * @returns {Array} スコア順にソートされた結果 [{ ...prompt, _searchScore, _matchType }]
 */
export const searchPrompts = (prompts, query, mode = "smart") => {
  if (!query || !query.trim()) return prompts;

  const rawQuery = query.trim();
  if (rawQuery.length > 2000) return prompts;

  // スペースでトークン分割 (全角スペースも対応)
  const tokens = rawQuery
    .split(/[\s　]+/)
    .filter((t) => t.length > 0)
    .map((t) => normalize(t));

  if (tokens.length === 0) return prompts;

  const results = [];

  prompts.forEach((prompt) => {
    const { score, matchType } = scorePrompt(prompt, tokens, mode);
    if (score > 0) {
      results.push({
        ...prompt,
        _searchScore: score,
        _matchType: matchType,
      });
    }
  });

  // スコア降順ソート
  results.sort((a, b) => b._searchScore - a._searchScore);

  return results;
};

/**
 * 検索モードのラベル
 */
export const SEARCH_MODES = {
  smart: { label: "スマート", description: "キーワード + 意図 + 曖昧" },
  keyword: { label: "キーワード", description: "完全・部分一致" },
  intent: { label: "意図検索", description: "関連語を自動展開" },
  fuzzy: { label: "あいまい", description: "類似文字列マッチ" },
};

export { normalize, expandIntent, INTENT_MAP };
