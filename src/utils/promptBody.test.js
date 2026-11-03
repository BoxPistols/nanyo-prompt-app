import { describe, it, expect } from 'vitest';
import { buildBody, parseBody } from './promptBody';

describe('buildBody / parseBody', () => {
  it('セクションを見出し付きの本文にし、同じセクションに戻せる', () => {
    const sections = { role: 'あなたは編集者です', instructions: '{文章}を校正して', output: '箇条書き' };
    const body = buildBody(sections);
    expect(body).toBe('あなたの役割\nあなたは編集者です\n\n実行指示\n{文章}を校正して\n\n出力形式\n箇条書き');
    expect(parseBody(body)).toEqual(sections);
  });

  it('空のセクションは本文に含めない', () => {
    expect(buildBody({ purpose: '  ', instructions: '要約して' })).toBe('実行指示\n要約して');
  });

  it('見出しの無い本文は実行指示として扱う', () => {
    expect(parseBody('ただの指示文')).toEqual({ instructions: 'ただの指示文' });
    expect(parseBody('')).toEqual({});
  });
});
