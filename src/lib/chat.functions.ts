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

// The knowledge-base index says which act each article belongs to, so a citation can
// carry the right act name instead of the single one this file used to know. Art. 30 is
// in the citizenship act, and labelling it "ustawa o cudzoziemcach" was simply false.
// An act with no verified address here renders as plain text: a wrong link is worse than
// no link, so nothing is guessed.
const ACT_URLS: Record<string, string> = {
  "ustawa o cudzoziemcach":
    "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=wdu20130001650",
  "ustawa o obywatelstwie polskim":
    "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20120000161",
};

/** The act an article really belongs to; null when the index cannot say unambiguously. */
function ustawaDla(detail: string, mapa: Record<string, string[]>): string | null {
  const nr = detail.match(/art\.\s?(\d+[a-z]?)/i)?.[1];
  if (!nr) return null;
  const akty = mapa[nr.toLowerCase()] ?? mapa[nr] ?? [];
  return akty.length === 1 ? akty[0] : null;
}

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
  releasedBy?: string[];
  references?: Record<string, EliRef[]>;
};
type EliAct = {
  eli: string;
  address: string;
  title: string;
  type: string;
  issuer: string;
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
        // Official titles open with boilerplate ("Rozporządzenie Ministra ... z dnia 10 sierpnia 2026 r.
        // w sprawie ") that repeats on every act and eats the part that says what the act is about.
        // The issuing body comes from its own short field instead.
        const gist = String(it.title ?? "")
          .replace(/^.*?z dnia \d{1,2} \S+ \d{4} r\.\s*/i, "")
          .replace(/^w sprawie\s+/i, "")
          .trim();
        return {
          eli: String(it.ELI),
          address: String(it.address),
          title: (gist || String(it.title ?? "")).slice(0, 110),
          type: String(it.type ?? ""),
          issuer: (it.releasedBy ?? [])[0] ?? "",
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
      const bits = [a.eli, [a.type, a.issuer].filter(Boolean).join(" — "), a.title];
      if (a.date) bits.push(`z dnia ${a.date}`);
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

const ART_REF = /art\.\s?\d+[a-z]?(?:\s+ust\.\s?\d+)?/gi;

const normalizeArt = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** Every "art. X (ust. Y)" reference that appears anywhere in the selected legal base. */
function verifiedRefsFrom(tekst: string): Set<string> {
  const set = new Set<string>();
  for (const m of tekst.matchAll(ART_REF)) {
    set.add(normalizeArt(m[0]));
    const bare = m[0].match(/^art\.\s?\d+[a-z]?/i)?.[0];
    if (bare) set.add(normalizeArt(bare));
  }
  return set;
}

/**
 * Removes articles the selected topics explicitly forbid. This is what makes a rule like
 * "art. 321 belongs only to the Border Guard chain" enforceable: it stopped being a
 * sentence in the prompt that the model ignored twice, and became data the code checks.
 */
function bezZakazanych(dozwolone: Set<string>, zakazane: Set<string>): Set<string> {
  if (!zakazane.size) return dozwolone;
  return new Set(
    [...dozwolone].filter((ref) => {
      const nr = ref.match(/^art\.\s?(\d+[a-z]?)/i)?.[1];
      return !nr || !zakazane.has(nr.toLowerCase());
    }),
  );
}

/** Removes an article reference the curated legal base does not contain. */
function verifyDetail(detail: string, verified: Set<string>): string {
  let d = detail;
  const found = d.match(new RegExp(ART_REF.source, "i"));
  if (found && !verified.has(normalizeArt(found[0]))) {
    d = d.replace(found[0], "");
  }
  return d
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:.–-]+|[\s,;:–-]+$/g, "")
    .trim();
}

/** Strips every article reference the curated legal base does not contain, anywhere in the text. */
function stripUnverifiedArticles(text: string, verified: Set<string>): string {
  let out = text;
  const matches = out.match(new RegExp(ART_REF.source, "gi")) ?? [];
  for (const m of matches) {
    if (!verified.has(normalizeArt(m))) out = out.split(m).join("");
  }
  return out
    .replace(/\(\s*\)/g, "")
    .replace(/\(\s*(?:§|ust\.)\s*\d+[a-z]?\s*\)/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[\s,;:.–-]+|[\s,;:–-]+$/g, "")
    .trim();
}

/** Strips every citation the model invented, keeps verified ones, then expands markers. Order matters. */
function sanitizeCitations(
  text: string,
  acts: EliAct[] = [],
  verified: Set<string> = new Set(),
  mapaUstaw: Record<string, string[]> = {},
): string {
  const byEli = new Map(acts.map((a) => [a.eli.toUpperCase(), a]));
  const urls = [
    ...Object.values(LAW_LINKS).map((l) => l.url),
    ...Object.values(ACT_URLS),
    ...acts.map((a) => eliUrl(a.address)),
  ];

  /** One expansion for both marker spellings, so the act name is decided in a single place. */
  const rozwin = (key: string, detail: string): string => {
    const entry = LAW_LINKS[key];
    if (!entry) return "";
    const d = verifyDetail(String(detail).trim(), verified);
    const wlasciwa = key === "USTAWA" ? ustawaDla(d, mapaUstaw) : null;
    const label = wlasciwa ?? entry.label;
    const url = wlasciwa && wlasciwa !== entry.label ? ACT_URLS[wlasciwa] : entry.url;
    const tekst = d ? `${label}, ${d}` : label;
    return url ? `[${tekst}](${url})` : tekst;
  };

  let out = text;

  // -1. Any "art. X ust. Y" the curated legal base does not literally contain is a
  // fabricated pinpoint citation — remove it everywhere, inside markers and in plain prose.
  out = stripUnverifiedArticles(out, verified);

  // The model sometimes stylizes our own [LAW:...]/[ELI:...] markers with full-width
  // brackets (【 】) instead of ASCII ones — normalize before parsing so those markers
  // still get expanded into real links (or stripped) like normal ones, instead of
  // leaking through unprocessed.
  out = out.replace(/[【】]/g, (m) => (m === "【" ? "[" : "]"));


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
  out = out.replace(/\[LAW:([A-Z0-9_]+)([^\]]*)\]/g, (_m, key: string, detail: string) =>
    rozwin(key, detail),
  );

  // The model sometimes drops the square brackets around its own marker; expand that form
  // too, so internal marker syntax is never shown to the user.
  out = out.replace(
    /\bLAW:([A-Z0-9_]+)((?:\s+art\.\s?\d+[a-z]?(?:\s+ust\.\s?\d+[a-z]?)?)?)/g,
    (_m, key: string, detail: string) => rozwin(key, detail),
  );

  // 3. Expand catalogue markers — only ids that really exist in the live register survive,
  //    which makes an invented citation structurally impossible.
  out = out.replace(/\[ELI:\s*(DU\/\d{4}\/\d+)([^\]]*)\]/gi, (_m, id: string, detail: string) => {
    const act = byEli.get(String(id).toUpperCase());
    if (!act) return "";
    const d = verifyDetail(String(detail).trim(), verified);
    const label = `Dz.U. ${act.year} poz. ${act.pos}${d ? `, ${d}` : ""}`;
    return `[${label}](${eliUrl(act.address)})`;
  });

  // Also delete any leftover unbracketed ELI marker so the internal marker syntax never leaks.
  out = out.replace(/\bELI:\s*DU\/\d{4}\/\d+/gi, "");

  // Safety net: the model sometimes copies a catalogue id as plain text instead of using
  // the marker. Only ids that really exist in the catalogue become links.
  out = out.replace(/\bDU\/(\d{4})\/(\d+)\b/g, (m, y: string, p: string) => {
    const act = byEli.get(`DU/${y}/${p}`);
    return act ? `[Dz.U. ${act.year} poz. ${act.pos}](${eliUrl(act.address)})` : m;
  });

  // 3a. The model sometimes wraps a finished link in an extra pair of brackets and bold
  // markers — "[**[ustawa o cudzoziemcach, art. 108](url)**]" — and the user saw the stray
  // "[**" and "**]" around the link. Keep the link, drop the wrapper.
  out = out.replace(/\[\s*\*{0,2}\s*(\[[^\]]+\]\([^)]+\))\s*\*{0,2}\s*\]/g, "$1");

  // 3b. Anything still in single square brackets is neither a verified link nor a
  // recognized marker — the model wrote an ad-hoc citation-style aside that doesn't map
  // to anything real. Unwrap it to plain text instead of leaking raw brackets to the user.
  // (Skip brackets immediately followed by "(" — those are the real markdown links built above.)
  out = out.replace(/\[([^\]]*)\](?!\()/g, "$1");

  // 3c. The model sometimes drops the space around a marker, so the expanded link runs
  // straight into the surrounding word or the next link ("3-4 tygodniekomunikaty...").
  // Insert the missing space back.
  out = out.replace(/([^\s(\[])\[/g, "$1 [");


  // 4. Restore the parked URLs.
  urls.forEach((url, i) => {
    out = out.split(`@@LAWURL${i}@@`).join(url);
  });

  // 4b. The legal base now prints the act's name next to every topic, so the model tends
  // to write the citation out in prose AND emit the marker for it, producing
  // "art. 112a ust. 1 ustawy o cudzoziemcach ustawa o cudzoziemcach, art. 112a ust. 1".
  // Drop the prose copy sitting directly in front of a generated link — but only the part
  // the link really repeats. The first version of this deleted the article number along
  // with the act name, and when the model emitted a marker WITHOUT an article number
  // ("[LAW:USTAWA]"), that deletion removed the only place the provision appeared: the
  // answer then cited a bare act and no article at all. The link's own text now decides.
  out = out.replace(
    /(?:(art\.\s?\d+[a-z]?(?:\s+ust\.\s?\d+[a-z]?)?)\s+)?ustaw\w*\s+o\s+(?:cudzoziemcach|obywatelstwie\s+polskim)\s*[,;:.–—-]?\s*(?=\[[^\]]*\]\()/gi,
    (match: string, article: string | undefined, offset: number, whole: string) => {
      const link = whole.slice(offset + match.length).match(/^\[([^\]]*)\]/)?.[1] ?? "";
      const nr = article?.match(/\d+[a-z]?/i)?.[0];
      // The act name is always a duplicate here; the article survives unless the link carries it.
      if (nr && !new RegExp(`art\\.\\s?${nr}\\b`, "i").test(link)) return `${article} `;
      return "";
    },
  );

  // This site's own help pages are not a legal source, and "(FAQ o CUKR)" reads to the
  // user like one. Cite an act or an official page, or say nothing.
  out = out.replace(/\s*\((?:FAQ|F\.A\.Q\.|ЧаПи?)[^)]*\)/gi, "");

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

// Cost/fee questions in Ukrainian, Polish and English — these deserve live search too,
// but must NOT pull in the WSC announcements block below (that's for dates/queues, not fees).
const FEE_QUESTION =
  /(оплат|вартіст|кошту|ціна|ціну|opłat|koszt|cena|cenę|fee|price|cost)/i;

const PL_WORDS = /\b(ile|czy|jak|jaki|jaka|jakie|jakim|jakich|gdzie|kiedy|ktory|ktora|ktore|dla|moge|musze|chce|kosztuje|koszt|cena|wniosek|wniosku|pobyt|pobytu|karta|karty|karte|praca|pracy|dokument|dokumenty|termin|terminie|urzad|wojewoda|wojewody|zezwolenie|zezwolenia|obywatelstwo|obywatelstwa|odwolanie|decyzja|decyzji|jest|sie|nie|tak|oraz|lub|przez|bez|mam|mnie|jestem|trzeba|zlozyc|skladac|dostac|wyjechac|mieszkac|potrzebuje)\b/i;

/** Language of the user's current message — drives a per-message reply-language instruction. */
function detectReplyLanguage(text: string): "uk" | "pl" | "en" {
  if (/[\u0400-\u04FF]/.test(text)) return "uk";
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text)) return "pl";
  if (PL_WORDS.test(text)) return "pl";
  return "en";
}

const LANG_LABEL: Record<"uk" | "pl" | "en", string> = {
  uk: "Ukrainian",
  pl: "Polish",
  en: "English",
};


export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data) => ChatSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    const { buildSystemPrompt, getLegalIndex, selectLegalSections } = await import(
      "@/lib/chat-kb.server"
    );

    // Keep the payload small: only recent turns + retrieval-narrowed knowledge base.
    const history = data.messages.slice(-6);
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    const label = LANG_LABEL[detectReplyLanguage(lastUser)];
    const historyWithLangHint = history.map((m, i) =>
      i === history.length - 1 && m.role === "user"
        ? {
            ...m,
            content: `${m.content}\n\n[SYSTEM: This message is written in ${label}. Your entire reply must be written in ${label} only — never switch languages for any reason, even if the message contains Polish or Ukrainian legal terms, institution names, or proper nouns.]`,
          }
        : m,
    );


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

    // Fetched once per request, before the prompt is built, so buildSystemPrompt stays
    // synchronous and the retry loop below does not have to await anything.
    const indeks = await getLegalIndex();
    const wybor = indeks
      ? selectLegalSections(indeks, lastUser)
      : { tekst: "", wpisy: [] as { artykuly: string[]; artykuly_zakazane: string[] }[] };

    // Only the search-capable model may be told it can search; telling a tool-less
    // model to search makes it emit a tool call that Groq rejects with 400.
    const systemPromptFor = (withSearch: boolean) =>
      [
        buildSystemPrompt(lastUser, withSearch, detectReplyLanguage(lastUser), wybor.tekst),
        ...extras,
      ].join("\n\n");

    const buildBody = (model: string, withSearch: boolean) =>
      JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        // gpt-oss models otherwise spend the whole budget on internal reasoning and
        // return empty content; the reasoning must also never come back to us at all.
        ...(model.startsWith("openai/gpt-oss")
          ? { include_reasoning: false, reasoning_effort: "low" }
          : {}),
        // search_settings/include_domains was a Compound-only parameter. browser_search has
        // no domain filter, so the source rule lives in the SEARCH section of the prompt.
        ...(withSearch ? { tools: [{ type: "browser_search" }], tool_choice: "auto" } : {}),
        messages: [
          { role: "system", content: systemPromptFor(withSearch) },
          ...historyWithLangHint,
        ],
      });

    // groq/compound-mini was decommissioned by Groq on 2026-09-21 with no successor. Web
    // search now comes from the built-in `browser_search` tool of gpt-oss. The same model
    // is listed again without search, so a failure of the search tool (unsupported on the
    // plan, timeout, 400) degrades to an offline answer instead of the failure message.
    const ALL_CANDIDATES = [
      { model: "openai/gpt-oss-120b", withSearch: true },
      { model: "openai/gpt-oss-120b", withSearch: false },
      { model: "openai/gpt-oss-20b", withSearch: false },
    ];

    // Diagnostic trace: what each model actually did on this request. It is attached to the
    // thrown error, so a failure can be read off the response instead of being guessed at.
    const trace: string[] = [];
    const short = (model: string) => model.split("/").pop() ?? model;

    const candidates = ALL_CANDIDATES.filter((c) => {
      if (isCooling(c.model)) {
        trace.push(`${short(c.model)}:cooldown`);
        return false;
      }
      return true;
    });

    if (!candidates.length) throw new Error(`RATE_LIMITED [${trace.join(", ")}]`);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let res: Response | undefined;
    let text = "";
    outer: for (const candidate of candidates) {
      const body = buildBody(candidate.model, candidate.withSearch);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Without a deadline a hung upstream request blocks the whole turn and the
          // fallback models never get a chance — the user just sees the failure message.
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body,
            signal: AbortSignal.timeout(30_000),
          });
        } catch {
          trace.push(`${short(candidate.model)}:neterr`);
          res = undefined;
          if (attempt === 2) break;
          await sleep(1000 * 2 ** attempt);
          continue;
        }

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          text = (json.choices?.[0]?.message?.content ?? "").trim();
          if (text) {
            trace.push(`${short(candidate.model)}:ok`);
            break outer;
          }
          // Empty content: let the next model try. Never fall back to the model's raw
          // reasoning — internal monologue must never reach the user.
          trace.push(`${short(candidate.model)}:empty`);
          break;
        }
        // Rejected, too large or rate-limited: this model can't serve the request right now, move to the fallback model.
        if (res.status === 429) {
          const after = Number(res.headers.get("retry-after"));
          const wait = Number.isFinite(after) && after > 0 ? after * 1000 : COOLDOWN_MS;
          modelCooldown.set(candidate.model, Date.now() + Math.min(wait, 600_000));
          trace.push(`${short(candidate.model)}:429`);
          break;
        }
        if (res.status === 400 || res.status === 413) {
          trace.push(`${short(candidate.model)}:${res.status}`);
          break;
        }
        // Any other non-retryable client error: no point trying the fallback, give up.
        if (res.status < 500) {
          trace.push(`${short(candidate.model)}:${res.status}`);
          break outer;
        }
        if (attempt === 2) {
          trace.push(`${short(candidate.model)}:${res.status}x3`);
          break;
        }

        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 8000)
          : 1000 * 2 ** attempt + Math.floor(Math.random() * 300);
        await sleep(waitMs);
      }
    }

    if (!text) {
      const summary = trace.join(", ") || "no-attempts";
      const status = res?.status ?? 0;
      if (res && !res.ok) {
        // Provider details stay in the server log; users must never see raw error payloads.
        console.error("Groq error", status, summary, await res.text());
      } else {
        console.error("Groq produced no usable answer", summary);
      }
      // For the user this is the same "busy, try shortly" situation whenever every model
      // was rate-limited, cooling down, silent or unreachable. The bracketed trace says
      // what actually happened and is what makes these failures diagnosable.
      const busy =
        trace.length > 0 && trace.every((t) => /:(429|cooldown|empty|neterr)$/.test(t));
      throw new Error(`${busy ? "RATE_LIMITED" : "ASSISTANT_FAILED"} [${summary}]`);
    }

    // An article one topic forbids stays forbidden only while no OTHER selected topic
    // claims it as its own. Several topics are selected per question, so without this
    // subtraction the Border Guard chain lost art. 321 to the voivode topic's prohibition
    // — in the one answer where art. 321 was exactly the right citation.
    const jawne = new Set(
      wybor.wpisy.flatMap((w) => w.artykuly || []).map((a) => String(a).toLowerCase()),
    );
    const zakazane = new Set(
      wybor.wpisy
        .flatMap((w) => w.artykuly_zakazane || [])
        .map((a) => String(a).toLowerCase())
        .filter((a) => !jawne.has(a)),
    );
    const dozwolone = bezZakazanych(verifiedRefsFrom(wybor.tekst), zakazane);
    // The cascade trace used to exist only inside the thrown error, so it was visible
    // exactly when every model failed. A silent fall back to the offline models looked
    // identical to a normal answer, and "is the search model serving?" had to be inferred
    // from response latency — which is guessing, not measuring. It rides along now.
    return {
      text: sanitizeCitations(text, acts, dozwolone, indeks?.artykulyUstaw ?? {}),
      trace: trace.join(", "),
      baza: `${wybor.wpisy.length} tematów, ${new TextEncoder().encode(wybor.tekst).length} B`,
    };
  });
