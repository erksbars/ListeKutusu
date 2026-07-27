"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui";

type Theme = "light" | "dark";

const storageKey = "listekutusu-theme";
const themeEvent = "listekutusu:theme-change";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const syncTheme = () => setTheme(readTheme());
    syncTheme();
    window.addEventListener(themeEvent, syncTheme);
    return () => window.removeEventListener(themeEvent, syncTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(new Event(themeEvent));
  }

  const label = theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç";

  return (
    <Button
      onClick={toggleTheme}
      variant="secondary"
      size="icon"
      className={`theme-toggle ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
