import { useEffect, useMemo, useRef, useState } from "react";
import { X, Send, ExternalLink, Bot, User } from "lucide-react";
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

type Msg =
  | { role: "bot"; kind: "text"; text: string }
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

export function ChatbotPanel({ open, onOpenChange }: ChatbotPanelProps) {
  const locale = useLocale();
  const t = getDict(locale).chatbot;
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "bot", kind: "text", text: t.subtitle + " — " + t.disclaimer },
  ]);
  const [input, setInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, showForm, revealed]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", kind: "text", text }]);
    const idx = matchFaq(locale, text);
    setTimeout(() => {
      if (idx !== null) {
        const item = getDict(locale).faq.items[idx];
        setMessages((m) => [
          ...m,
          { role: "bot", kind: "text", text: item.a },
          { role: "bot", kind: "links" },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "bot", kind: "text", text: t.noMatch },
          { role: "bot", kind: "links" },
        ]);
      }
    }, 250);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="fixed bottom-5 right-5 z-50 flex h-[min(640px,90vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <div>
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="text-xs opacity-80">{t.subtitle}</div>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          aria-label={t.close}
          className="rounded-md p-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} m={m} t={t} />
        ))}
        {showForm && !revealed && (
          <LeadForm
            onDone={() => setRevealed(true)}
            initialService=""
          />
        )}
        {revealed && <ContactReveal />}
      </div>

      {!showForm && !revealed && (
        <div className="border-t border-border p-3">
          <div className="mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              {t.personalHelp}
            </Button>
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
            />
            <Button type="submit" size="icon" aria-label={t.send}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
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
        {m.text}
      </div>
    </div>
  );
}

function LeadForm({ onDone, initialService }: { onDone: () => void; initialService: string }) {
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
