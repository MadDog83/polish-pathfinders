import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

// The ONLY links the assistant may ever surface. Model output can never introduce a URL.
const LAW_LINKS: Record<string, { url: string; label: string }> = {
  USTAWA: {
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=wdu20130001650",
    label: "ustawa o cudzoziemcach",
  },
  NOWELIZACJA2025: {
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001794",
    label: "nowelizacja 2025 (Dz.U. 2025 poz. 1794)",
  },
  NOWELIZACJA2026: {
    url: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000203",
    label: "nowelizacja 2026 (Dz.U. 2026 poz. 203)",
  },
  KOMUNIKATY: {
    url: "https://migrant.wsc.mazowieckie.pl/komunikaty",
    label: "komunikaty WSC Mazowieckie",
  },
};

/** Strips every citation the model invented, then inserts our own verified links. Order matters. */
function sanitizeCitations(text: string): string {
  let out = text;

  // 1. Remove anything citation-like that the MODEL wrote — none of it is verifiable.
  out = out.replace(/\[([^\]]*)\]\(\s*https?:\/\/[^)]*\)/gi, "$1");
  out = out.replace(/https?:\/\/[^\s)\]]+/gi, "");
  out = out.replace(/\bDz\.?\s?U\.?\s?(?:z\s+)?\d{4}\s*(?:r\.)?\s*,?\s*poz\.\s?\d+/gi, "");
  out = out.replace(/\bWDU\d{6,}\b/gi, "");

  // 2. Only now insert OUR verified links, so the cleanup above can never damage them.
  out = out.replace(/\[LAW:([A-Z0-9]+)([^\]]*)\]/g, (_m, key: string, detail: string) => {
    const entry = LAW_LINKS[key];
    if (!entry) return "";
    const d = String(detail).trim();
    return `[${d ? `${entry.label}, ${d}` : entry.label}](${entry.url})`;
  });

  // 3. Tidy leftovers from the deletions.
  out = out.replace(/\[\s*([^\]]*)\]\(\s*\)/g, "$1");
  out = out.replace(/\(\s*\)/g, "");
  out = out.replace(/\s+([,.;:])/g, "$1");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out.trim();
}

let komunikatyCache: { text: string; at: number } | null = null;

/** Reads the WSC announcements page server-side (30 min cache) so both models see the same fresh facts. */
async function getKomunikaty(): Promise<string> {
  const now = Date.now();
  if (komunikatyCache && now - komunikatyCache.at < 30 * 60 * 1000) return komunikatyCache.text;
  try {
    const r = await fetch("https://migrant.wsc.mazowieckie.pl/komunikaty", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SmartLegalizationBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return komunikatyCache?.text ?? "";
    const html = await r.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1500);
    komunikatyCache = { text, at: now };
    return text;
  } catch {
    return komunikatyCache?.text ?? "";
  }
}

// Date/schedule/announcement questions in Ukrainian, Polish and English.
const TIME_SENSITIVE =
  /(коли|дата|дати|термін|строк|розклад|субот|оголош|комунікат|черг|найближч|актуальн|kiedy|data|termin|harmonogram|sobot|komunikat|ogłosz|kolejk|najbliższ|aktualn|when|date|deadline|schedule|saturday|announcement|queue|current|latest)/i;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data) => ChatSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    const { buildSystemPrompt } = await import("@/lib/chat-kb.server");

    // Keep the payload small: only recent turns + retrieval-narrowed knowledge base.
    const history = data.messages.slice(-8);
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

    const komunikaty = TIME_SENSITIVE.test(lastUser) ? await getKomunikaty() : "";
    const systemPrompt = komunikaty
      ? `${buildSystemPrompt(lastUser)}\n\n# АКТУАЛЬНІ ОГОЛОШЕННЯ WSC\n(Raw text in Polish, fetched live from the official WSC announcements page. Reference material ONLY: translate any fact you take from it into the user's language — never switch your reply to Polish just because this block is Polish. When you use it, add the marker [LAW:KOMUNIKATY].)\n${komunikaty}`
      : buildSystemPrompt(lastUser);

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    const buildBody = (model: string, withSearch: boolean) =>
      JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        ...(withSearch
          ? {
              search_settings: {
                include_domains: [
                  "www.gov.pl",
                  "*.gov.pl",
                  "mos.cudzoziemcy.gov.pl",
                  "migrant.wsc.mazowieckie.pl",
                  "isap.sejm.gov.pl",
                ],
              },
            }
          : {}),
        messages,
      });

    // Primary model adds live official-source search; the fallback has a separate
    // quota, so a rate-limited primary still gets an answer instead of an error.
    const candidates: { model: string; withSearch: boolean }[] = [
      { model: "groq/compound-mini", withSearch: true },
      { model: "openai/gpt-oss-120b", withSearch: false },
    ];

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let res: Response | undefined;
    let text = "";
    outer: for (const candidate of candidates) {
      const body = buildBody(candidate.model, candidate.withSearch);
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string; reasoning?: string } }[];
          };
          const msg = json.choices?.[0]?.message;
          text = (msg?.content ?? "").trim() || (msg?.reasoning ?? "").trim();
          // compound models sometimes answer with tool output only; let the fallback model try.
          if (text) break outer;
          break;
        }
        // Payload too large or rate-limited: this model can't serve the request right now, move to the fallback model.
        if (res.status === 413 || res.status === 429) break;
        // Any other non-retryable client error: no point trying the fallback, give up.
        if (res.status < 500) break outer;
        if (attempt === 2) break;

        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 8000)
          : 1000 * 2 ** attempt + Math.floor(Math.random() * 300);
        await sleep(waitMs);
      }
    }

    if (!text) {
      const status = res?.status ?? 0;
      if (res && !res.ok) {
        console.error("Groq error", status, await res.text());
        if (status === 429) throw new Error("RATE_LIMITED");
        throw new Error(`Assistant unavailable (${status})`);
      }
      throw new Error("Empty assistant response");
    }

    return { text: sanitizeCitations(text) };
  });

