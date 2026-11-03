import { describe, it, expect } from 'vitest';
import { parsePromptContent, fillPrompt } from './promptContent';

describe('parsePromptContent', () => {
  it('本文中の {変数} をインライン変数として重複なく抽出する', () => {
    const r = parsePromptContent('{対象}について{対象}の要点を{形式}でまとめて');
    expect(r.inlinePlaceholders).toEqual(['対象', '形式']);
    expect(r.additionalVars).toEqual([]);
    expect(r.allPlaceholders).toEqual(['対象', '形式']);
  });

  it('「変数設定」セクションの項目を追加変数にし、本文からは取り除く', () => {
    const r = parsePromptContent('次の文章を要約して\n\n変数設定\n対象の文章\n\n出力言語');
    expect(r.promptText).toBe('次の文章を要約して');
    expect(r.additionalVars).toEqual(['対象の文章', '出力言語']);
  });

  it('「補足」より後ろは変数として扱わない', () => {
    const r = parsePromptContent('指示\n\nユーザー入力\n相談内容\n\n補足\n丁寧に答える');
    expect(r.additionalVars).toEqual(['相談内容']);
    expect(r.promptText).toContain('補足\n丁寧に答える');
  });

  it('h3 見出しと textarea 初期値に分かれたサブ項目を親項目に統合する（README の #304 の例）', () => {
    const body = '比較して\n\n変数設定\nAIモデル①の回答\n\nAIモデル①の名称：\n\nAIモデル①の回答：';
    expect(parsePromptContent(body).additionalVars).toEqual(['AIモデル①の回答']);
  });

  it('インライン変数と同名のセクション項目は追加変数に重ねない', () => {
    const r = parsePromptContent('{元の文章}を直して\n\n変数設定\n元の文章\n\n文体');
    expect(r.inlinePlaceholders).toEqual(['元の文章']);
    expect(r.additionalVars).toEqual(['文体']);
  });

  it('改行コードを LF にそろえ、元ページのボタン文言の混入を取り除く', () => {
    const r = parsePromptContent('一行目\r\n二行目\r\n\n戻る\nプロンプト作成\nクリップボードにコピーされます。');
    expect(r.promptText).toBe('一行目\n二行目');
  });
});

describe('fillPrompt', () => {
  const parsed = parsePromptContent('{対象}を{形式}で説明して\n\n変数設定\n読者');

  it('入力値でインライン変数を置き換え、追加変数を末尾に付ける', () => {
    const text = fillPrompt({ ...parsed, values: { 対象: '生成AI', 形式: '箇条書き', 読者: '新任職員' } });
    expect(text).toBe('生成AIを箇条書きで説明して\n\n読者: 新任職員');
  });

  it('未入力の変数は {名前} のまま残す', () => {
    const text = fillPrompt({ ...parsed, values: { 対象: '生成AI' } });
    expect(text).toBe('生成AIを{形式}で説明して\n\n読者: {読者}');
  });

  it('正規表現の特殊文字を含む変数名も置き換えられる', () => {
    const p = parsePromptContent('{金額(円)}を確認');
    expect(fillPrompt({ ...p, values: { '金額(円)': '1000' } })).toBe('1000を確認');
  });
});
