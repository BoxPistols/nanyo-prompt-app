export const PROMPT_SECTIONS = [
  { key: "purpose", label: "目的・ねらい", placeholder: "このプロンプトの目的を記述", rows: 2 },
  { key: "role", label: "あなたの役割", placeholder: "例: あなたは優秀なアシスタントです", rows: 3 },
  { key: "prerequisites", label: "前提条件", placeholder: "前提となる条件やリソースを記述", rows: 3 },
  { key: "instructions", label: "実行指示 *", placeholder: "AIへの具体的な指示を記述\n{変数名} で変数を埋め込めます", rows: 5 },
  { key: "rules", label: "ルール", placeholder: "守るべきルールや制約を記述", rows: 4 },
  { key: "output", label: "出力形式", placeholder: "例: マークダウン形式で出力", rows: 3 },
  { key: "supplement", label: "補足", placeholder: "補足事項があれば記述", rows: 2 },
  { key: "variables", label: "変数設定", placeholder: "ユーザーが入力する変数名を改行区切りで記述\n例:\n対象の文章\n出力言語", rows: 3 },
];

export const buildBody = (sections) => {
  return PROMPT_SECTIONS
    .filter(s => sections[s.key]?.trim())
    .map(s => `${s.label.replace(/ \*$/, '')}\n${sections[s.key].trim()}`)
    .join('\n\n');
};

export const parseBody = (body) => {
  if (!body) return {};
  const result = {};
  const labels = PROMPT_SECTIONS.map(s => s.label.replace(/ \*$/, ''));
  const pattern = new RegExp(`^(${labels.join('|')})$`, 'm');
  const parts = body.split(pattern).filter(Boolean);
  for (let i = 0; i < parts.length - 1; i++) {
    const label = parts[i].trim();
    const sec = PROMPT_SECTIONS.find(s => s.label.replace(/ \*$/, '') === label);
    if (sec) {
      result[sec.key] = parts[i + 1].trim();
      i++;
    }
  }
  // body全体がセクション分割できない場合は instructionsに入れる
  if (Object.keys(result).length === 0 && body.trim()) {
    result.instructions = body.trim();
  }
  return result;
};
