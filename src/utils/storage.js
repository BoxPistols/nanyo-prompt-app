export const readJsonArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // ストレージ自体が使えない環境 (プライベートモード等) では消せなくても実害がないため無視する
    try { localStorage.removeItem(key); } catch { /* noop */ }
    return [];
  }
};
