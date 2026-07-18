import { Link, useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSwitcher } from "@/components/lang-switcher";
import { useLocale, localeFromPath } from "@/lib/use-locale";
import { DEFAULT_LOCALE, LOCALES, SITE_NAME, getDict, localePath } from "@/i18n";
import { Button } from "@/components/ui/button";
import { MessageCircle, Scale } from "lucide-react";

const ChatbotPanel = lazy(() =>
  import("@/components/chat/chatbot-panel").then((m) => ({ default: m.ChatbotPanel })),
);

function LocaleHtmlSync() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const l = localeFromPath(pathname);
    document.documentElement.lang = l;
  }, [pathname]);
  return null;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);

  const openChat = () => {
    setChatMounted(true);
    setChatOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LocaleHtmlSync />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader onOpenChat={openChat} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />

      {/* Floating chat button */}
      <FloatingChatButton onClick={openChat} chatOpen={chatOpen} />

      {chatMounted && (
        <Suspense fallback={null}>
          <ChatbotPanel open={chatOpen} onOpenChange={setChatOpen} />
        </Suspense>
      )}
    </div>
  );
}

function SiteHeader({ onOpenChat }: { onOpenChat: () => void }) {
  const locale = useLocale();
  const t = getDict(locale);
  const home = localePath(locale, "/");
  const news = localePath(locale, "/news");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={home} className="flex items-center gap-2 font-semibold" aria-label={SITE_NAME}>
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Scale className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-sm sm:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Primary">
          <a href={`${home}#services`} className="text-muted-foreground hover:text-foreground">{t.nav.services}</a>
          <a href={`${home}#faq`} className="text-muted-foreground hover:text-foreground">{t.nav.faq}</a>
          <Link to={news} className="text-muted-foreground hover:text-foreground">{t.nav.news}</Link>
          <a href={`${home}#about`} className="text-muted-foreground hover:text-foreground">{t.nav.about}</a>
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onOpenChat} className="hidden gap-1.5 sm:inline-flex">
            <MessageCircle className="h-4 w-4" />
            {t.header.openChat}
          </Button>
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  const locale = useLocale();
  const t = getDict(locale);
  const home = localePath(locale, "/");

  return (
    <footer className="border-t border-border/60 bg-card/50 py-10 text-sm text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Scale className="h-4 w-4" aria-hidden />
            </span>
            {SITE_NAME}
          </div>
          <p className="mt-2 max-w-md">{t.footer.tagline}</p>
          <p className="mt-4 text-xs">{t.currencyNote}</p>
        </div>
        <div>
          <div className="mb-2 font-medium text-foreground">{t.nav.services}</div>
          <ul className="space-y-1">
            <li><a href={`${home}#services`} className="hover:text-foreground">{t.services.items[0].title}</a></li>
            <li><a href={`${home}#services`} className="hover:text-foreground">{t.services.items[1].title}</a></li>
            <li><a href={`${home}#services`} className="hover:text-foreground">{t.services.items[2].title}</a></li>
            <li><a href={`${home}#services`} className="hover:text-foreground">{t.services.items[3].title}</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-medium text-foreground">{t.footer.legal}</div>
          <ul className="space-y-1">
            <li><Link to={localePath(locale, "/privacy")} className="hover:text-foreground">{t.footer.privacy}</Link></li>
            <li><Link to={localePath(locale, "/terms")} className="hover:text-foreground">{t.footer.terms}</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">{t.nav.admin}</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs">
        {t.footer.rights}
        <span className="mx-2">·</span>
        <LangLinks />
      </div>
    </footer>
  );
}

function LangLinks() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <span className="inline-flex gap-3">
      {LOCALES.map((l) => (
        <Link key={l} to={l === DEFAULT_LOCALE ? "/" : `/${l}`} className="hover:text-foreground" aria-current={localeFromPath(pathname) === l}>
          {l.toUpperCase()}
        </Link>
      ))}
    </span>
  );
}

function FloatingChatButton({ onClick, chatOpen }: { onClick: () => void; chatOpen: boolean }) {
  const locale = useLocale();
  const t = getDict(locale);
  if (chatOpen) return null;
  return (
    <button
      onClick={onClick}
      aria-label={t.header.openChat}
      className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-sm font-medium sm:inline">{t.header.openChat}</span>
    </button>
  );
}
