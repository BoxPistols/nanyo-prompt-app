import { useState } from "react";
import { ANNOUNCEMENTS, ANNOUNCEMENTS_DISMISSED_KEY } from "../constants";
import { readJsonArray } from "../utils/storage";

export function useAnnouncements() {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(() => readJsonArray(ANNOUNCEMENTS_DISMISSED_KEY));

  const activeAnnouncements = ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.includes(a.id));
  const pastAnnouncements = ANNOUNCEMENTS.filter(a => dismissedAnnouncements.includes(a.id));
  const hasUnread = activeAnnouncements.length > 0;

  const dismissAnnouncement = (id) => {
    setDismissedAnnouncements(prev => {
      const next = [...new Set([...prev, id])];
      try { localStorage.setItem(ANNOUNCEMENTS_DISMISSED_KEY, JSON.stringify(next)); } catch { /* 保存できない環境では既読状態がこのセッション内だけ有効になる */ }
      return next;
    });
  };
  const dismissAllAnnouncements = () => {
    const allIds = ANNOUNCEMENTS.map(a => a.id);
    setDismissedAnnouncements(allIds);
    try { localStorage.setItem(ANNOUNCEMENTS_DISMISSED_KEY, JSON.stringify(allIds)); } catch { /* 保存できない環境では既読状態がこのセッション内だけ有効になる */ }
  };

  return { activeAnnouncements, pastAnnouncements, hasUnread, dismissAnnouncement, dismissAllAnnouncements };
}
