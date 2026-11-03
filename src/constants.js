// ─── Constants & Helpers ───────────────────────────────────────────────────
export const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
export const MOD_KEY = isMac ? 'metaKey' : 'ctrlKey';
export const MOD_LABEL = isMac ? '⌘' : 'Ctrl';

export const STORAGE_KEY = "nanyo_prompts_v5";
export const PER_PAGE = 32;

// ─── Announcements ──────────────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  {
    id: "2026-03-12-launch",
    date: "2026-03-12",
    label: "リニューアル",
    title: "アプリをリニューアルしました",
    body: "検索機能の強化、AIツール連携、ダークモード対応など、多数の改善を行いました。",
  },
];
export const ANNOUNCEMENTS_DISMISSED_KEY = STORAGE_KEY + "_announcements_dismissed";


export const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', query: '' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', query: '' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', query: '' },
];
