import { useEffect } from "react";

// active の間だけ、ref の外側で mousedown されたら setOpen(false) を呼ぶ
export function useOutsideClick(ref, active, setOpen) {
  useEffect(() => {
    if (!active) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [active, ref, setOpen]);
}
