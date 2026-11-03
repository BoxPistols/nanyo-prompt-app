import { describe, it, expect } from 'vitest';
import { sanitizePrompt } from './backup';

describe('sanitizePrompt', () => {
  it('想定外の型は空値に落とし、利用者プロンプトとして扱う', () => {
    expect(sanitizePrompt({ id: '1', title: 3, body: null, isUser: false })).toEqual({
      id: null, title: '', body: '', c1: '', c2: '', url: '', isUser: true, createdAt: '',
    });
  });

  it('http(s) 以外の URL は捨てる', () => {
    expect(sanitizePrompt({ url: 'javascript:alert(1)' }).url).toBe('');
    expect(sanitizePrompt({ url: 'https://example.com/' }).url).toBe('https://example.com/');
  });

  it('長すぎるタイトルと本文を切り詰める', () => {
    const s = sanitizePrompt({ title: 'あ'.repeat(600), body: 'い'.repeat(60000) });
    expect(s.title).toHaveLength(500);
    expect(s.body).toHaveLength(50000);
  });
});
