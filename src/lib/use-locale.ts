import { useRouterState } from "@tanstack/react-router";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n";

export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (LOCALES as readonly string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return localeFromPath(pathname);
}

export function stripLocale(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0];
  if ((LOCALES as readonly string[]).includes(seg) && seg !== DEFAULT_LOCALE) {
    return pathname.replace(new RegExp(`^/${seg}`), "") || "/";
  }
  return pathname;
}
