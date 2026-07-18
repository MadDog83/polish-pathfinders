import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/use-locale";
import { getDict } from "@/i18n";

type Choice = "light" | "dark" | "system";
const KEY = "sls-theme";

function apply(choice: Choice) {
  if (typeof document === "undefined") return;
  const dark =
    choice === "dark" ||
    (choice === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const e = document.documentElement;
  e.classList.toggle("dark", dark);
  e.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const locale = useLocale();
  const t = getDict(locale).header.theme;
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined"
      ? (localStorage.getItem(KEY) as Choice | null)
      : null) ?? "system";
    setChoice(saved);
    apply(saved);
    if (saved === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply("system");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  const set = useCallback((c: Choice) => {
    setChoice(c);
    if (c === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
    apply(c);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.toggle} className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => set("light")} aria-current={choice === "light"}>
          <Sun className="mr-2 h-4 w-4" /> {t.light}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => set("dark")} aria-current={choice === "dark"}>
          <Moon className="mr-2 h-4 w-4" /> {t.dark}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => set("system")} aria-current={choice === "system"}>
          <Monitor className="mr-2 h-4 w-4" /> {t.system}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
