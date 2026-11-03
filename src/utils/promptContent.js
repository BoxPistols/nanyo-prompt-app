/**
 * 上流 HTML をテキスト化したプロンプト本文から、AI に渡す本文と入力欄 (変数) を組み立てる。
 * - 本文中の {変数} をインライン変数として抽出する
 * - 「変数設定」「ユーザー入力」セクションの項目を追加変数として抽出し、本文からは取り除く
 * - 上流 HTML の h3 見出し + textarea 初期値が別項目に分かれる重複を、親項目に統合する
 */
export const parsePromptContent = (rawContent) => {
  let content = rawContent
    .replace(/[\s]*戻る[\s]*プロンプト作成[\s]*クリップボードにコピーされます。[\s]*$/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 「変数設定」「ユーザー入力」セクションから変数名を抽出
  const sectionRegex = /\n*(?:変数設定|ユーザー入力)\n([\s\S]*?)(?=\n+補足\n|$)/;
  const sectionMatch = content.match(sectionRegex);
  let sectionVars = [];
  if (sectionMatch) {
    const rawVars = sectionMatch[1]
      .split(/\n\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    // h3見出し＋textarea内容の重複を解消: コロン付きサブ項目を親項目に統合
    // 例: ["AIモデル①の回答", "AIモデル①の名称：", "AIモデル①の回答："] → ["AIモデル①の回答"]
    const merged = [];
    for (let i = 0; i < rawVars.length; i++) {
      const v = rawVars[i];
      // 前の項目（親候補）がコロンなしで、現在の項目がコロン付きサブ項目なら統合対象
      if (merged.length > 0 && /[：:]$/.test(v)) {
        const parent = merged[merged.length - 1];
        if (!/[：:]$/.test(parent) && v.replace(/[：:]$/, '').includes(parent.replace(/の回答|の入力|の情報/g, '').substring(0, 4))) {
          continue; // サブ項目をスキップ（親に統合）
        }
      }
      merged.push(v);
    }
    sectionVars = merged;
    content = content.replace(sectionRegex, '');
  }

  content = content.replace(/\n{3,}/g, '\n\n').trim();

  // テキスト内の {変数} プレースホルダー抽出
  const inlineMatches = content.match(/\{([^}]+)\}/g) || [];
  const inline = [...new Set(inlineMatches.map(m => m.slice(1, -1)))];

  // セクションにのみ存在する追加変数（テキスト内に {var} がないもの）
  const additional = sectionVars.filter(v => !inline.includes(v));

  return {
    promptText: content,
    inlinePlaceholders: inline,
    additionalVars: additional,
    allPlaceholders: [...inline, ...additional],
  };
};

/** 入力値でインライン変数を置き換え、追加変数は「名前: 値」として末尾に付ける。未入力の変数は {名前} のまま残す */
export const fillPrompt = ({ promptText, values, inlinePlaceholders, additionalVars }) => {
  let result = promptText;
  inlinePlaceholders.forEach(key => {
    const regex = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
    result = result.replace(regex, values[key] || `{${key}}`);
  });
  if (additionalVars.length > 0) {
    const parts = additionalVars.map(key => `${key}: ${values[key] || `{${key}}`}`);
    result += '\n\n' + parts.join('\n');
  }
  return result;
};
