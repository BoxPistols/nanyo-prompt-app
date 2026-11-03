import { useState, useEffect } from "react";
import { STORAGE_KEY } from "../constants";

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "_theme");
      return saved === "dark" || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch { return false; }
  });

  useEffect(() => {
    if (darkMode) { document.body.classList.add('dark'); localStorage.setItem(STORAGE_KEY + "_theme", "dark"); } 
    else { document.body.classList.remove('dark'); localStorage.setItem(STORAGE_KEY + "_theme", "light"); }
  }, [darkMode]);

  return [darkMode, setDarkMode];
}
