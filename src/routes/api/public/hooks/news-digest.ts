import { createFileRoute } from "@tanstack/react-router";

/**
 * Weekly automated "news drafts" pipeline.
 *
 * Fetches the UdSC announcements list on gov.pl and the WSC Mazowieckie announcements
 * list, skips anything already present in
 * `news` (dedup on source_url), asks the LLM for a strictly factual uk/pl/en
 * summary of each new item and inserts the result as UNPUBLISHED drafts.
 * Nothing here ever publishes a row.
 *
 * Bounds: at most MAX_ITEMS new announcements per run, a database single-flight
 * lock, per-item error isolation and a circuit breaker that pauses the job on
 * hard AI failures (402/403) or repeated rate limiting.
 */

const JOB_NAME = "news-digest";
const MAX_ITEMS = 5;
const MAX_AGE_DAYS = 35; // one failed weekly run must not lose an announcement for good
const LOCK_MINUTES = 10;
const UA = "Mozilla/5.0 (compatible; SmartLegalizationBot/1.0)";
const MODEL = "openai/gpt-oss-120b";

const UDSC_LIST = "https://www.gov.pl/web/udsc/aktualnosci-udsc";
// The voivodeship office posts what UdSC never does: the new certificate that replaced the
// passport stamp (19.10.2026) appeared only here, so a UdSC-only run reported "0 new".
const WSC_BASE = "https://migrant.wsc.mazowieckie.pl";
const WSC_LIST = `${WSC_BASE}/pl/komunikaty`;

// Fixed renderings for Polish administrative terms. Every entry answers a real mistake in
// published drafts (Oct 2026): "Urząd informuje" became "Уряд повідомив" (the government),
// "subkonto" became "підрахунок" (a calculation), "na wniosek Prezesa Rady Ministrów" became
// "на підставі постанови" (by decree). The Ukrainian side follows the wording the site
// already uses (src/i18n), so drafts and pages say the same thing.
const GLOSSARY: [pl: string, uk: string, en: string][] = [
  ["urząd (the office that publishes)", "управління / установа — NEVER «уряд»", "the Office"],
  [
    "Urząd do Spraw Cudzoziemców (UdSC)",
    "Управління у справах іноземців (UdSC)",
    "Office for Foreigners (UdSC)",
  ],
  ["Urząd Wojewódzki", "воєводське управління", "Voivodeship Office"],
  ["wojewoda", "воєвода", "voivode"],
  ["rząd", "уряд", "the government"],
  ["Prezes Rady Ministrów", "Голова Ради міністрів", "the Prime Minister"],
  ["karta pobytu", "карта побиту", "residence card"],
  [
    "zezwolenie na pobyt czasowy / stały",
    "дозвіл на тимчасове / постійне перебування",
    "temporary / permanent residence permit",
  ],
  ["rezydent długoterminowy UE", "довгостроковий резидент ЄС", "EU long-term resident"],
  [
    "wniosek; złożyć wniosek",
    "заява; подати заяву (подання, NOT «подача»)",
    "application; submit an application",
  ],
  [
    "na wniosek X",
    "на прохання X / за поданням X — NEVER «на підставі постанови»",
    "at the request of X",
  ],
  ["decyzja / postanowienie", "рішення / постанова (procedural)", "decision / procedural order"],
  ["odwołanie", "оскарження (апеляція)", "appeal"],
  [
    "ochrona czasowa / międzynarodowa",
    "тимчасовий / міжнародний захист",
    "temporary / international protection",
  ],
  [
    "obowiązki wojskowe",
    "військові обов'язки (NOT «військова служба»)",
    "military obligations (NOT military service)",
  ],
  [
    "konto; subkonto",
    "обліковий запис; субакаунт — NEVER «рахунок», «підрахунок»",
    "account; sub-account",
  ],
  ["Genewski Dokument Podróży", "Женевський проїзний документ", "Geneva Travel Document"],
  ["e-Doręczenia", "e-Doręczenia (keep the name)", "e-Doręczenia (e-delivery)"],
  [
    "Ministerstwo Obrony Narodowej",
    "Міністерство національної оборони",
    "Ministry of National Defence",
  ],
  [
    "Ministerstwo Spraw Wewnętrznych i Administracji",
    "Міністерство внутрішніх справ і адміністрації",
    "Ministry of the Interior and Administration",
  ],
  ["Rządowe Centrum Bezpieczeństwa", "Урядовий центр безпеки", "Government Centre for Security"],
  [
    "Wydział Spraw Cudzoziemców (WSC) Mazowieckiego Urzędu Wojewódzkiego",
    "Відділ у справах іноземців (WSC) Мазовецького воєводського управління",
    "Foreigners' Department (WSC) of the Mazowieckie Voivodeship Office",
  ],
  ["Sobota Informacyjna", "Інформаційна субота", "Information Saturday"],
  ["zaświadczenie", "довідка", "certificate"],
  ["ul. Marszałkowska 3/5", "вул. Маршалковська 3/5", "3/5 Marszałkowska Street"],
];

type Item = { title: string; url: string; date: string | null; intro: string };

const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** gov.pl UdSC list page: `<div class="event"><span class="date">DD.MM.YYYY</span>` + `<div class="title"><a href>` + `<div class="intro">`. */
function parseUdsc(html: string): Item[] {
  const items: Item[] = [];
  const blocks = html.split(/<li>/i);
  for (const block of blocks) {
    const link = /<div class="title">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!link) continue;
    const dateRaw = /<span class="date">\s*(\d{2})\.(\d{2})\.(\d{4})/i.exec(block);
    const intro = /<div class="intro">([\s\S]*?)<\/div>/i.exec(block);
    const href = link[1]!.startsWith("http") ? link[1]! : `https://www.gov.pl${link[1]}`;
    items.push({
      title: stripTags(link[2] ?? ""),
      url: href,
      date: dateRaw ? `${dateRaw[3]}-${dateRaw[2]}-${dateRaw[1]}` : null,
      intro: stripTags(intro?.[1] ?? ""),
    });
  }
  return items.filter((i) => i.title.length > 5);
}

/**
 * WSC Mazowieckie list page: `<div class="views-row">` + `<h2 class="title"><a href>` +
 * `<div class="date">DD.MM.YYYY</div>` + `<div class="teaser">`. Entries titled
 * "Komunikat Urzędu do Spraw Cudzoziemców - …" repost UdSC announcements under another URL;
 * the UdSC source already drafts those, and taking them here too would draft them twice.
 */
function parseWsc(html: string): Item[] {
  const items: Item[] = [];
  for (const block of html.split(/<div class="views-row/i).slice(1)) {
    const link = /<h2 class="title">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!link) continue;
    const dateRaw = /<div class="date">\s*(\d{2})\.(\d{2})\.(\d{4})/i.exec(block);
    const teaser = /<div class="teaser">([\s\S]*?)<\/div>/i.exec(block);
    items.push({
      title: stripTags(link[2] ?? ""),
      url: link[1]!.startsWith("http") ? link[1]! : `${WSC_BASE}${link[1]}`,
      date: dateRaw ? `${dateRaw[3]}-${dateRaw[2]}-${dateRaw[1]}` : null,
      intro: stripTags(teaser?.[1] ?? ""),
    });
  }
  return items.filter(
    (i) => i.title.length > 5 && !/^komunikat urz[ęe]du do spraw cudzoziemc/i.test(i.title),
  );
}


function slugify(input: string): string {
  const map: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  };
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => map[c] ?? c)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "news";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** String comparison whose running time does not reveal how many leading characters match. */
function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

type Summary = { title: string; summary: string };
type LlmResult = Record<"uk" | "pl" | "en", Summary>;

class AiBlocked extends Error {
  constructor(readonly status: number) {
    super(`AI blocked with status ${status}`);
  }
}

async function summarize(apiKey: string, item: Item, pageText: string): Promise<LlmResult | null> {
  const source = [
    `URL: ${item.url}`,
    item.date ? `DATE: ${item.date}` : "",
    `HEADLINE: ${item.title}`,
    // Kept small on purpose: the Groq tier has a tokens-per-minute budget shared
    // with the site chatbot, and the announcement gist sits at the top of the page.
    `PAGE TEXT:\n${(pageText || item.intro).slice(0, 2200)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const system = [
    "You summarize official Polish immigration-office announcements for a legal-help website.",
    "Rules you must never break:",
    "- Use ONLY facts that appear in the SOURCE text below. Never add, infer or guess facts, numbers, dates, fees, deadlines, offices or legal articles.",
    "- If the source text is too thin to summarize, return the field \"insufficient\": true.",
    "- Keep it neutral and factual. No advice, no marketing, no invented links.",
    "Output STRICT JSON only, no markdown, with this exact shape:",
    '{"insufficient": false, "uk": {"title": "...", "summary": "..."}, "pl": {"title": "...", "summary": "..."}, "en": {"title": "...", "summary": "..."}}',
    "Each title: short factual headline (max 110 characters). Each summary: 2-3 sentences.",
    "uk = Ukrainian, pl = Polish, en = English. Same facts in all three.",
    "- Never add who said or urged something unless the source names them.",
    "- Names of portal buttons and sections (MOS, inPOL) stay in Polish in quotes; in uk and en add a translation in brackets.",
    "TERMINOLOGY — always use exactly these renderings (Polish → Ukrainian → English):",
    ...GLOSSARY.map(([pl, uk, en]) => `- ${pl} → ${uk} → ${en}`),
  ].join("\n");

  const call = () => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 1200,
      include_reasoning: false,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `SOURCE:\n${source}` },
      ],
    }),
  });

  // Bounded backoff: rate limits are transient and the response says how long to wait.
  let r = await call();
  for (let attempt = 0; attempt < 2 && r.status === 429; attempt++) {
    const body = await r.text();
    console.error(`[news-digest] LLM 429, backing off: ${body.slice(0, 200)}`);
    const wait = Number(/try again in ([\d.]+)s/i.exec(body)?.[1] ?? 20);
    await sleep(Math.min(Math.max(wait, 5) * 1000 + 1500, 40_000));
    r = await call();
  }

  if (r.status === 402 || r.status === 403 || r.status === 401 || r.status === 429) {
    console.error(`[news-digest] LLM blocked ${r.status}: ${(await r.text()).slice(0, 400)}`);
    throw new AiBlocked(r.status);
  }
  if (!r.ok) {
    console.error(`[news-digest] LLM ${r.status} for ${item.url}: ${(await r.text()).slice(0, 300)}`);
    return null;
  }

  const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as Partial<LlmResult> & { insufficient?: boolean };
    if (parsed.insufficient) return null;
    for (const lang of ["uk", "pl", "en"] as const) {
      const v = parsed[lang];
      if (!v?.title?.trim() || !v?.summary?.trim()) return null;
    }
    return parsed as LlmResult;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/hooks/news-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // The publishable key is public (it ships in the browser bundle), so it only proves
        // the caller read the site's JavaScript. NEWS_DIGEST_SECRET is a real secret; once it
        // is set, it is the only accepted credential. Without it the old check stays, so the
        // weekly cron keeps running until it is switched over to the secret.
        const secret = process.env["NEWS_DIGEST_SECRET"];
        const expected =
          secret ??
          process.env["SUPABASE_PUBLISHABLE_KEY"] ??
          process.env["SUPABASE_ANON_KEY"] ??
          "";
        if (!secret) {
          console.warn("[news-digest] NEWS_DIGEST_SECRET not set; accepting the public key");
        }
        const provided =
          request.headers.get("x-cron-secret") ??
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!expected || !timingSafeEqual(provided, expected)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const nowIso = new Date().toISOString();

        // ---- paused-state guard + single-flight lock -------------------------
        const { data: state } = await supabaseAdmin
          .from("job_state")
          .select("is_paused, locked_until")
          .eq("job_name", JOB_NAME)
          .maybeSingle();

        if (state?.is_paused) {
          return Response.json({ skipped: "paused" });
        }
        if (state?.locked_until && new Date(state.locked_until).getTime() > Date.now()) {
          return Response.json({ skipped: "locked" });
        }

        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
        const { error: lockError } = await supabaseAdmin
          .from("job_state")
          .upsert(
            { job_name: JOB_NAME, locked_until: lockUntil, last_run_at: nowIso, last_status: "running" },
            { onConflict: "job_name" },
          );
        if (lockError) {
          console.error("[news-digest] lock failed:", lockError.message);
          return Response.json({ error: "lock failed" }, { status: 500 });
        }

        const finish = async (status: string, extra?: { paused?: string }) => {
          await supabaseAdmin
            .from("job_state")
            .update({
              locked_until: null,
              last_status: status,
              ...(extra?.paused ? { is_paused: true, pause_reason: extra.paused } : {}),
            })
            .eq("job_name", JOB_NAME);
        };

        try {
          const apiKey = process.env["GROQ_API_KEY"];
          if (!apiKey) {
            await finish("error: GROQ_API_KEY missing");
            return Response.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
          }

          // Either source failing leaves the other one working.
          const [udscHtml, wscHtml] = await Promise.all([
            fetchText(UDSC_LIST),
            fetchText(WSC_LIST),
          ]);
          const candidates: Item[] = [
            ...(udscHtml ? parseUdsc(udscHtml) : []),
            ...(wscHtml ? parseWsc(wscHtml) : []),
          ];
          if (!candidates.length) {
            await finish("no items parsed");
            return Response.json({ inserted: 0, note: "no items parsed" });
          }

          const { data: existing, error: existingError } = await supabaseAdmin
            .from("news")
            .select("source_url")
            .not("source_url", "is", null);
          if (existingError) throw new Error(existingError.message);
          const seen = new Set((existing ?? []).map((r) => (r.source_url ?? "").trim()));

          const ageCutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
          const fresh = candidates
            .filter((i) => !seen.has(i.url.trim()))
            .filter((i) => i.date && new Date(i.date).getTime() >= ageCutoff)
            .filter((i, idx, arr) => arr.findIndex((o) => o.url === i.url) === idx)
            .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
            .slice(0, MAX_ITEMS);

          const today = new Date().toISOString().slice(0, 10);
          let inserted = 0;
          const skipped: string[] = [];

          for (const item of fresh) {
            try {
              const detail = await fetchText(item.url);
              // gov.pl pages open with ~2.5k characters of portal navigation; the announcement
              // itself is inside <article>. Sending the page from the top gave the model only the
              // menu, so every item came back "insufficient" (Sept 2026: nothing drafted for weeks).
              const articleHtml = detail ? /<article[\s\S]*?<\/article>/i.exec(detail)?.[0] ?? detail : "";
              const pageText = articleHtml ? stripTags(articleHtml).slice(0, 6000) : item.intro;
              if (!pageText || pageText.length < 80) {
                skipped.push(`${item.url} (no text)`);
                continue;
              }

              const result = await summarize(apiKey, item, pageText);
              if (!result) {
                skipped.push(`${item.url} (llm)`);
                continue;
              }

              const publishedAt = item.date ?? today;
              const base = `${slugify(result.en.title)}-${publishedAt}`;

              for (const language of ["uk", "pl", "en"] as const) {
                let slug = base;
                for (let attempt = 0; attempt < 5; attempt++) {
                  const { error } = await supabaseAdmin.from("news").insert({
                    slug,
                    language,
                    title: result[language].title.slice(0, 200),
                    summary: result[language].summary.slice(0, 1000),
                    body: null,
                    source_url: item.url,
                    published_at: publishedAt,
                    is_published: false,
                  });
                  if (!error) break;
                  if (error.code === "23505") {
                    slug = `${base}-${attempt + 2}`;
                    continue;
                  }
                  throw new Error(error.message);
                }
              }
              inserted += 1;
              // Pace the run so a batch stays inside the tokens-per-minute budget.
              await sleep(8000);
            } catch (err) {
              if (err instanceof AiBlocked) throw err;
              console.error(`[news-digest] item failed ${item.url}:`, err);
              skipped.push(`${item.url} (error)`);
            }
          }

          await finish(
            `ok: ${inserted} drafted, ${skipped.length} skipped` +
              (skipped.length ? ` — ${skipped.join("; ")}`.slice(0, 900) : ""),
          );
          return Response.json({ inserted, drafts: inserted * 3, skipped });
        } catch (err) {
          if (err instanceof AiBlocked) {
            // 429 parks until the next scheduled run; 401/402/403 need an owner action.
            const transient = err.status === 429;
            await finish(
              `ai ${err.status}`,
              transient ? undefined : { paused: `AI request blocked with status ${err.status}` },
            );
            return Response.json({ error: `ai ${err.status}` }, { status: 503 });
          }
          console.error("[news-digest] run failed:", err);
          await finish(`error: ${err instanceof Error ? err.message : "unknown"}`);
          return Response.json({ error: "run failed" }, { status: 500 });
        }
      },
    },
  },
});
