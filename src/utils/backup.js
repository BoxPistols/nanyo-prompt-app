// インポートされた JSON は利用者が任意に編集できるため、型と長さを検証してから取り込む
export const sanitizePrompt = (p) => ({
  id: typeof p.id === 'number' ? p.id : null,
  title: typeof p.title === 'string' ? p.title.slice(0, 500) : "",
  body: typeof p.body === 'string' ? p.body.slice(0, 50000) : "",
  c1: typeof p.c1 === 'string' ? p.c1.slice(0, 100) : "",
  c2: typeof p.c2 === 'string' ? p.c2.slice(0, 100) : "",
  url: typeof p.url === 'string' && /^https?:\/\//i.test(p.url) ? p.url : "",
  isUser: true,
  createdAt: typeof p.createdAt === 'string' ? p.createdAt : "",
});
