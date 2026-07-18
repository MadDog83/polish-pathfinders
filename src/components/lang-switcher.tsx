import { Link, useRouterState } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { localeFromPath, stripLocale } from "@/lib/use-locale";

const LABELS: Record<Locale, string> = { uk: "UA", en: "EN", pl: "PL" };

export function LangSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = localeFromPath(pathname);
  const base = stripLocale(pathname);

  const to = (l: Locale) =>
    l === DEFAULT_LOCALE ? (base === "/" ? "/" : base) : `/${l}${base === "/" ? "" : base}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Language" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{LABELS[current]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link to={to(l)} aria-current={l === current}>
              {LABELS[l]} — {l === "uk" ? "Українська" : l === "en" ? "English" : "Polski"}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
