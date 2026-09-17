"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const key = "filmstock-theme-v1";
function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(key);
    } catch {}
    document.documentElement.dataset.theme =
      saved === "dark" || saved === "light"
        ? saved
        : media.matches
          ? "dark"
          : "light";
    notify();
  };
  media.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  window.addEventListener("filmstock-theme", notify);
  return () => {
    media.removeEventListener("change", sync);
    window.removeEventListener("storage", sync);
    window.removeEventListener("filmstock-theme", notify);
  };
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "light",
    () => "light",
  );
  const label = theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환";
  return (
    <button
      className="icon-button"
      type="button"
      title={label}
      aria-label={label}
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(key, next);
        } catch {}
        window.dispatchEvent(new Event("filmstock-theme"));
      }}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
