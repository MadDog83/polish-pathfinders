import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X, Send, ExternalLink, Bot, User, Minus, GripHorizontal, Plus, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/use-locale";
import { getDict, TELEGRAM_URL, CONTACT_EMAIL, CONTACT_PHONE } from "@/i18n";
import { matchFaq } from "@/components/chat/kb";
import { submitLead } from "@/lib/leads.functions";
import { askAssistant } from "@/lib/chat.functions";
import { useIsMobile } from "@/hooks/use-mobile";

type Msg =
  | { role: "bot"; kind: "text"; text: string }
  | { role: "bot"; kind: "intro" }
  | { role: "bot"; kind: "links" }
  | { role: "user"; kind: "text"; text: string };

const OFFICIAL = {
  application: "https://mos.cudzoziemcy.gov.pl",
  status: "https://inpol.mazowieckie.pl",
  general: "https://www.gov.pl/web/udsc",
};

export interface ChatbotPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function clampPanelOffset(x: number, y: number, panel: HTMLDivElement | null): { x: number; y: number } {
  if (!panel || typeof window === "undefined") return { x, y };
  const margin = 20; // matches the bottom-5 / right-5 (5 * 4px) base offset
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const naturalLeft = window.innerWidth - margin - width;
  const naturalTop = window.innerHeight - margin - height;
  const minX = -naturalLeft;
  const maxX = margin;
  const minY = -naturalTop;
  const maxY = margin;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export function ChatbotPanel({ open, onOpenChange }: ChatbotPanelProps) {
  const locale = useLocale();
  const t = getDict(locale).chatbot;
  const [messages, setMessages] = useState<Msg[]>(() => [{ role: "bot", kind: "intro" }]);
  const [input, setInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mobile = mounted ? isMobile : typeof window !== "undefined" ? window.innerWidth < 768 : false;
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    if (minimized) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, showForm, revealed, thinking, minimized]);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset],
  );

  const onDragMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    e.preventDefault();
    const nextX = d.baseX + (e.clientX - d.startX);
    const nextY = d.baseY + (e.clientY - d.startY);
    setOffset(clampPanelOffset(nextX, nextY, panelRef.current));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  useLayoutEffect(() => {
    setOffset((prev) => clampPanelOffset(prev.x, prev.y, panelRef.current));
  }, [minimized]);


  const resetChat = () => {
    setMessages([{ role: "bot", kind: "intro" }]);
    historyRef.current = [];
    setShowForm(false);
    setRevealed(false);
    setInput("");
    setConfirmEnd(false);
    onOpenChange(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", kind: "text", text }]);
    historyRef.current = [...historyRef.current, { role: "user" as const, content: text }].slice(-12);
    setThinking(true);
    try {
      const res = await askAssistant({ data: { messages: historyRef.current } });
      historyRef.current = [...historyRef.current, { role: "assistant" as const, content: res.text }].slice(-12);
      setMessages((m) => [...m, { role: "bot", kind: "text", text: res.text }]);
    } catch (err) {
      console.error(err);
      const idx = matchFaq(locale, text);
      const fallback = idx !== null ? getDict(locale).faq.items[idx].a : t.noMatch;
      setMessages((m) => [...m, { role: "bot", kind: "text", text: fallback }]);
    } finally {
      setThinking(false);
    }
  };


  if (!open) return null;

  if (minimized && mobile) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label={t.expand}
        className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{t.title}</span>
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t.title}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className={`fixed bottom-5 right-5 z-50 flex w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl ${
        minimized ? "h-auto" : "h-[min(640px,90vh)]"
      }`}
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        title={t.dragHint}
        className="flex touch-none items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-2">
          <GripHorizontal className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{t.title}</div>
            <div className="truncate text-xs opacity-80">{t.subtitle}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setMinimized((v) => !v)}
            aria-label={minimized ? t.expand : t.minimize}
            className="rounded-md p-1 hover:bg-white/10"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onOpenChange(false)}
            aria-label={t.close}
            className="rounded-md p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {!minimized && (
      <>


      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} m={m} t={t} />
        ))}
        {showForm && !revealed && (
          <LeadForm
            onDone={() => setRevealed(true)}
            onBack={() => setShowForm(false)}
            onClose={() => onOpenChange(false)}
            initialService=""
          />
        )}
        {revealed && <ContactReveal />}
        {thinking && (
          <div className="flex gap-2" aria-live="polite">
            <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-muted px-3 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-muted/40 px-3 py-2 text-[11px]">
        <span className="font-medium text-muted-foreground">{t.officialLinks}</span>
        <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.application} target="_blank" rel="noreferrer">MOS <ExternalLink className="h-3 w-3" /></a>
        <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.status} target="_blank" rel="noreferrer">inPOL <ExternalLink className="h-3 w-3" /></a>
        <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.general} target="_blank" rel="noreferrer">gov.pl/UDSC <ExternalLink className="h-3 w-3" /></a>
      </div>

      {!showForm && !revealed && (
        <div className="border-t border-border p-3">
          <div className="mb-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowForm(true)}
            >
              {t.personalHelp}
            </Button>
            {confirmEnd ? (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">{t.endChatConfirm}</span>
                <Button type="button" size="sm" variant="destructive" className="h-8 px-2 text-xs" onClick={resetChat}>
                  {t.confirmYes}
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setConfirmEnd(false)}>
                  {t.confirmNo}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-xs text-muted-foreground"
                onClick={() => setConfirmEnd(true)}
              >
                {t.endChat}
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              disabled={thinking}
            />
            <Button type="submit" size="icon" aria-label={t.send} disabled={thinking}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      </>
      )}
    </div>

  );
}

function MessageBubble({ m, t }: { m: Msg; t: ReturnType<typeof getDict>["chatbot"] }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {m.text}
        </div>
        <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }
  if (m.kind === "links") {
    return (
      <div className="flex gap-2">
        <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm">
          <div className="mb-1 font-medium">{t.officialLinks}</div>
          <ul className="space-y-1">
            <li>
              <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.application} target="_blank" rel="noreferrer">
                {t.linkApplication} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.status} target="_blank" rel="noreferrer">
                {t.linkStatus} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-1 text-primary underline" href={OFFICIAL.general} target="_blank" rel="noreferrer">
                {t.linkGeneral} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm">
        {m.kind === "intro" ? `${t.subtitle} — ${t.disclaimer}` : m.text}
      </div>
    </div>
  );
}

function LeadForm({ onDone, onBack, onClose, initialService }: { onDone: () => void; onBack: () => void; onClose: () => void; initialService: string }) {
  const locale = useLocale();
  const t = getDict(locale).chatbot;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(initialService || t.services[0]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = useMemo(() => t.services, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    return;
    setError(null);
    if (!name.trim()) return setError(t.validationName);
    if (!email.trim() && !phone.trim()) return setError(t.validationEmailOrPhone);
    if (!consent) return setError(t.validationConsent);

    setSubmitting(true);
    try {
      await submitLead({
        data: {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          service,
          language: locale,
          consent: true,
        },
      });
      onDone();
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-background p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.backToChat}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.close}</span>
        </button>
      </div>
      <div className="font-medium">{t.formHeading}</div>
      <p className="text-xs text-muted-foreground">{t.formLead}</p>
      <div>
        <Label htmlFor="lead-name">{t.name}</Label>
        <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="lead-email">{t.email}</Label>
          <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="lead-phone">{t.phone}</Label>
          <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div>
        <Label htmlFor="lead-service">{t.service}</Label>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger id="lead-service"><SelectValue /></SelectTrigger>
          <SelectContent>
            {serviceOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-start gap-2 text-xs">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} id="lead-consent" />
        <span className="leading-snug">{t.consent}</span>
      </label>
      {error && <div className="text-xs text-destructive" role="alert">{error}</div>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t.submitting : t.submit}
      </Button>
    </form>
  );
}

function ContactReveal() {
  const locale = useLocale();
  const t = getDict(locale).chatbot;
  return (
    <div className="space-y-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
      <div className="font-semibold">{t.revealTitle}</div>
      <p className="text-xs text-muted-foreground">{t.revealLead}</p>
      <ul className="space-y-1.5">
        <li>
          <a className="font-medium text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
        <li>
          <a className="font-medium text-primary underline" href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}>{CONTACT_PHONE}</a>
        </li>
      </ul>
      <Button asChild className="w-full">
        <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
          {t.telegram}
        </a>
      </Button>
    </div>
  );
}
