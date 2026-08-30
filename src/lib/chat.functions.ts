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
  locale: z.string().max(5).optional(),
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

// --- Live catalogue of foreigner-related acts from the official Sejm ELI register. ---
const BASE_ACT_ID = "DU/2013/1650"; // ustawa o cudzoziemcach
const CATALOGUE_FROM = "2025-07-01"; // only acts announced from H2 2025 on
const KB_COVERAGE_DATE = "2026-02-25"; // how current the curated legal knowledge base is
const CATALOGUE_MAX = 8;

type EliRef = { id?: string; art?: string };
type EliItem = {
  ELI?: string;
  address?: string;
  title?: string;
  type?: string;
  year?: number;
  pos?: number;
  announcementDate?: string;
  entryIntoForce?: string;
  inForce?: string;
  references?: Record<string, EliRef[]>;
};
type EliAct = {
  eli: string;
  address: string;
  title: string;
  type: string;
  year: number;
  pos: number;
  date: string;
  inForceFrom: string;
  basis: string;
  amendsBase: boolean;
};

function eliUrl(address: string): string {
  return `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=${address}`;
}

let eliCache: { acts: EliAct[]; at: number } | null = null;

/** Official machine-readable act register (ISAP itself disallows crawling; this API does not). */
async function getEliActs(): Promise<EliAct[]> {
  const now = Date.now();
  if (eliCache && now - eliCache.at < 6 * 60 * 60 * 1000) return eliCache.acts;
  try {
    const r = await fetch(
      "https://api.sejm.gov.pl/eli/acts/search?keyword=cudzoziemcy&limit=100",
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) return eliCache?.acts ?? [];
    const json = (await r.json()) as { items?: EliItem[] };
    const acts: EliAct[] = (json.items ?? [])
      .filter(
        (it) =>
          !!it?.ELI &&
          !!it?.address &&
          it?.inForce === "IN_FORCE" &&
          String(it?.announcementDate ?? "") >= CATALOGUE_FROM,
      )
      .map((it) => {
        const refs = it.references ?? {};
        const basisArt = (refs["Podstawa prawna z art."] ?? []).find((b) => b?.id === BASE_ACT_ID);
        return {
          eli: String(it.ELI),
          address: String(it.address),
          title: String(it.title ?? "").slice(0, 80),
          type: String(it.type ?? ""),
          year: Number(it.year ?? 0),
          pos: Number(it.pos ?? 0),
          date: String(it.announcementDate ?? ""),
          inForceFrom: String(it.entryIntoForce ?? ""),
          basis: basisArt?.art ? String(basisArt.art) : "",
          amendsBase: (refs["Akty zmienione"] ?? []).some((b) => b?.id === BASE_ACT_ID),
        };
      })
      .sort((a, b) => b.year - a.year || b.pos - a.pos)
      .slice(0, CATALOGUE_MAX);
    eliCache = { acts, at: now };
    return acts;
  } catch {
    return eliCache?.acts ?? [];
  }
}

function catalogueText(acts: EliAct[]): string {
  return acts
    .map((a) => {
      const bits = [a.eli, a.type, a.title];
      if (a.inForceFrom) bits.push(`w mocy od ${a.inForceFrom}`);
      if (a.basis) bits.push(`podst.: ${a.basis} ustawy o cudzoziemcach`);
      return `- ${bits.join(" | ")}`;
    })
    .join("\n");
}

/** Acts amending the base law that were published after the curated knowledge base was compiled. */
function staleNotice(acts: EliAct[]): string {
  return acts
    .filter((a) => a.amendsBase && a.date > KB_COVERAGE_DATE)
    .map((a) => `${a.eli} (${a.date})`)
    .join(", ");
}

// Questions about documents, acts, links or legal changes, in Ukrainian, Polish and English.
const DOC_QUESTION =
  /(закон|устав|акт|розпоряд|посилан|адрес|джерел|документ|стат|артик|змін|новел|формуляр|заяв|припис|ustaw|akt|rozporz|link|adres|źródł|dokument|artyku|przepis|zmian|nowel|formularz|wniosek|law|act|link|address|source|document|article|amend|form|application)/i;

/** Strips every citation the model invented, keeps verified ones, then expands markers. Order matters. */
function sanitizeCitations(text: string, acts: EliAct[] = []): string {
  const byEli = new Map(acts.map((a) => [a.eli.toUpperCase(), a]));
  const urls = [
    ...Object.values(LAW_LINKS).map((l) => l.url),
    ...acts.map((a) => eliUrl(a.address)),
  ];
  let out = text;

  // 0. Park verified URLs behind placeholders so the cleanup below cannot touch them
  //    (the model often copies them verbatim out of the conversation history).
  urls.forEach((url, i) => {
    out = out.split(url).join(`@@LAWURL${i}@@`);
  });

  // 1. Remove everything citation-like that is left — none of it is verifiable.
  out = out.replace(/\[([^\]]*)\]\(\s*https?:\/\/[^)]*\)/gi, "$1");
  out = out.replace(/https?:\/\/[^\s)\]]+/gi, "");
  out = out.replace(/\bDz\.?\s?U\.?\s?(?:z\s+)?\d{4}\s*(?:r\.)?\s*,?\s*poz\.\s?\d+/gi, "");
  out = out.replace(/\bWDU\d{6,}\b/gi, "");

  // 2. Expand our own markers into verified links.
  out = out.replace(/\[LAW:([A-Z0-9_]+)([^\]]*)\]/g, (_m, key: string, detail: string) => {
    const entry = LAW_LINKS[key];
    if (!entry) return "";
    const d = String(detail).trim();
    return `[${d ? `${entry.label}, ${d}` : entry.label}](${entry.url})`;
  });

  // 3. Expand catalogue markers — only ids that really exist in the live register survive,
  //    which makes an invented citation structurally impossible.
  out = out.replace(/\[ELI:\s*(DU\/\d{4}\/\d+)([^\]]*)\]/gi, (_m, id: string, detail: string) => {
    const act = byEli.get(String(id).toUpperCase());
    if (!act) return "";
    const d = String(detail).trim();
    const label = `Dz.U. ${act.year} poz. ${act.pos}${d ? `, ${d}` : ""}`;
    return `[${label}](${eliUrl(act.address)})`;
  });

  // 4. Restore the parked URLs.
  urls.forEach((url, i) => {
    out = out.split(`@@LAWURL${i}@@`).join(url);
  });

  // 5. Tidy leftovers from the deletions.
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

// A model that just returned 429 is skipped for a while instead of being hammered again.
const COOLDOWN_MS = 60_000;
const modelCooldown = new Map<string, number>();
const isCooling = (model: string) => (modelCooldown.get(model) ?? 0) > Date.now();

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
    const history = data.messages.slice(-6);
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

    const komunikaty = TIME_SENSITIVE.test(lastUser) ? await getKomunikaty() : "";
    const acts = await getEliActs();
    const stale = staleNotice(acts);

    const extras: string[] = [];

    if (komunikaty) {
      extras.push(
        `# АКТУАЛЬНІ ОГОЛОШЕННЯ WSC\n(Raw text in Polish, fetched live from the official WSC announcements page. Reference material ONLY: translate any fact you take from it into the user's language — never switch your reply to Polish just because this block is Polish. When you use it, add the marker [LAW:KOMUNIKATY].)\n${komunikaty}`,
      );
    }

    if (stale) {
      extras.push(
        `# NEWER AMENDMENTS\nThe curated legal knowledge base above reflects the law as of ${KB_COVERAGE_DATE}. These acts amend the ustawa o cudzoziemcach and were published AFTER that date: ${stale}. Whenever your answer touches a rule these could have changed, add one short sentence in the user's language saying that a newer amendment exists (give its date) and that the detail is worth verifying, and cite it with its [ELI:...] marker. Do not guess what they changed — you only know that they exist.`,
      );
    }

    if (DOC_QUESTION.test(lastUser) && acts.length) {
      extras.push(
        `# KATALOG AKTÓW (live official Sejm ELI register, in force, newest first)\n${catalogueText(acts)}\n\nTo point the user at one of these acts, emit its marker exactly as [ELI:DU/2026/553] — the system turns it into a verified clickable link. Never write a Dz.U. number or a URL yourself, and never cite an id that is not in this list. The link opens the act's page on ISAP, where both the original and the consolidated text are available.`,
      );
    }

    // Only the search-capable model may be told it can search; telling a tool-less
    // model to search makes it emit a tool call that Groq rejects with 400.
    const systemPromptFor = (withSearch: boolean) =>
      [buildSystemPrompt(lastUser, withSearch, data.locale), ...extras].join("\n\n");

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
        messages: [
          { role: "system", content: systemPromptFor(withSearch) },
          ...history,
        ],
      });

    // compound-mini has only 250 requests/day, so spend it only on questions that
    // actually need live search. Models cooling down after a 429 are skipped outright.
    const candidates = [
      ...(TIME_SENSITIVE.test(lastUser)
        ? [{ model: "groq/compound-mini", withSearch: true }]
        : []),
      { model: "openai/gpt-oss-120b", withSearch: false },
      { model: "openai/gpt-oss-20b", withSearch: false },
    ].filter((c) => !isCooling(c.model));

    if (!candidates.length) throw new Error("RATE_LIMITED");

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let res: Response | undefined;
    let text = "";
    let reasoningFallback = "";
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
          text = (msg?.content ?? "").trim();
          if (text) break outer;
          // Compound models sometimes return tool output only. Remember the raw reasoning
          // as an absolute last resort, but let the next model produce a real answer first.
          if (!reasoningFallback) reasoningFallback = (msg?.reasoning ?? "").trim();
          break;
        }
        // Rejected, too large or rate-limited: this model can't serve the request right now, move to the fallback model.
        if (res.status === 400 || res.status === 413 || res.status === 429) break;
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

    if (!text) text = reasoningFallback;

    if (!text) {
      const status = res?.status ?? 0;
      if (res && !res.ok) {
        const detail = await res.text();
        console.error("Groq error", status, detail);
        if (status === 429) throw new Error("RATE_LIMITED");
        // Surface the provider's own explanation — otherwise a 400 is undiagnosable from the client.
        throw new Error(`Assistant unavailable (${status}): ${detail.slice(0, 400)}`);
      }
      throw new Error("Empty assistant response");
    }

    return { text: sanitizeCitations(text, acts) };
  });
