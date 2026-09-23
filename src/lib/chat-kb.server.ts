import { getDict, LOCALES, SITE_NAME } from "@/i18n";

// groq/compound-mini enforces a small per-request size limit (413 request_too_large),
// so the prompt budget has to stay well below the previous 20k/15k figures.
const MAX_SITE_KB_CHARS = 2000; // site FAQ is secondary to the legal base; kept small for the free-plan token budget
const MAX_LEGAL_BYTES = 5000;

// The legal knowledge base is maintained in its own repository and only READ here, so a
// change to the law needs a rebuilt index — not a deploy of this app. Each entry is one
// topic and carries the act its articles belong to, which is what lets the citation
// verifier check an article against the right act instead of only against a number.
const INDEX_URL =
  "https://raw.githubusercontent.com/MadDog83/kb-smartlegal/main/index/kb-index.json";
const INDEX_TTL_MS = 6 * 60 * 60 * 1000;

export type WpisBazy = {
  id: string;
  tytul: string;
  ustawa: string | null;
  artykuly: string[];
  artykuly_zakazane: string[];
  /** Topics that must never share a prompt with this one — see the selection loop. */
  wyklucza?: string[];
  organ: string | null;
  ryzyko: string;
  slowa: string[];
  tresc: string;
};

export type IndeksBazy = {
  wpisy: WpisBazy[];
  artykulyUstaw: Record<string, string[]>;
};

let indeksCache: { dane: IndeksBazy; at: number } | null = null;

/** Fetched once and kept in memory; a failed refresh keeps serving the last good copy. */
export async function getLegalIndex(): Promise<IndeksBazy | null> {
  const now = Date.now();
  if (indeksCache && now - indeksCache.at < INDEX_TTL_MS) return indeksCache.dane;
  try {
    const r = await fetch(INDEX_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return indeksCache?.dane ?? null;
    const dane = (await r.json()) as IndeksBazy;
    if (!Array.isArray(dane?.wpisy) || dane.wpisy.length === 0) return indeksCache?.dane ?? null;
    indeksCache = { dane, at: now };
    return dane;
  } catch {
    return indeksCache?.dane ?? null;
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

// The hand-written PL/EN -> UA stem dictionary is gone. Every entry in the base now
// declares the words it should be found by, in all three languages, so the bridge that
// guessed at translations is no longer needed.

const bezOgonkow = (s: string): string =>
  s
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e").replace(/ł/g, "l")
    .replace(/ń/g, "n").replace(/ó/g, "o").replace(/ś/g, "s")
    .replace(/ź/g, "z").replace(/ż/g, "z");

// Five characters, not six: six loses the common pair "czekajac" (question) / "czeka"
// (entry), because the stem "czekaj" does not occur inside "czeka".
const rdzen = (w: string): string => (w.length > 5 ? w.slice(0, 5) : w);

// Function words of all three languages. Without this list, rarity weighting works
// backwards: the Ukrainian preposition "для" occurs in only two entries of this
// Polish-language base, so it looks maximally informative. In testing it outscored the
// correct answer and additionally triggered the high-risk bonus.
// Words asking about QUANTITY are deliberately absent: "ile" and "скільки" are part of
// declared keywords ("ile kosztuje", "скільки коштує") and removing them hurt retrieval.
const SLOWA_FUNKCYJNE = new Set([
  "jak", "jaki", "jaka", "jakie", "jakiego", "jakim", "czy", "gdzie", "kiedy",
  "kto", "cos", "dla", "przy", "pod", "nad", "tak", "ale", "lub", "ten", "tego", "juz",
  "jeszcze", "byc", "bylo", "bedzie", "trzeba", "moge", "mozna", "mam", "mnie", "chce",
  "jest", "sie", "nie", "oraz", "przez", "bez", "jestem", "potrzebne", "potrzebuje",
  "musze", "musza", "musi", "musimy", "moze", "moga", "powinien", "powinienem",
  "moj", "moja", "swoje", "teraz", "dalej", "znowu", "bardzo", "tylko",
  "які", "яка", "яке", "яко", "що", "чи", "де", "коли", "мені", "мене", "для",
  "при", "про", "від", "над", "під", "так", "але", "або", "цей", "вже", "ще", "бути",
  "буде", "було", "треба", "можу", "можна", "маю", "має", "хочу", "мій", "моя", "зараз",
  "how", "what", "when", "where", "which", "who", "why", "the", "and", "for", "with",
  "from", "about", "can", "may", "must", "need", "does", "did", "are", "was", "were",
  "will", "would", "should", "you", "your", "this", "that", "long", "many", "much",
  "take", "get", "have", "has", "there", "then", "still", "now",
]);

function tokenize(q: string): string[] {
  const slowa = bezOgonkow(String(q).toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !SLOWA_FUNKCYJNE.has(w));
  return Array.from(new Set(slowa.map(rdzen).filter((r) => !SLOWA_FUNKCYJNE.has(r))));
}

// Ukrainian and Polish inflect heavily, so a whole-word substring test misses the right
// section ("втрачаю" in the question never matches "втрачає" in the base). Compare stems.
function relevance(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((score, word) => {
    const stem = word.length > 6 ? word.slice(0, 6) : word;
    return score + (lower.includes(stem) ? 1 : 0);
  }, 0);
}

const WAGA_SLOWA = 3; // hit in the entry's declared keywords
const WAGA_TYTUL = 2; // hit in its title
const WAGA_TRESC = 1; // hit in its body
const BONUS_RYZYKO = 5; // a high-risk entry that matches at all must not lose on points
const PROG_POSPOLITOSCI = 0.5;

// Bonus for matching a multi-word declared keyword. These were dead weight until now:
// tokenizing splits "how much" into two function words and drops both, so the author's
// declaration had no effect at all — and the phrase is exactly what carries the intent.
// "How much does a temporary residence card cost?" reached the fees entry through the
// single word "cost" and lost to entries matching three weak ones ("card", "resid").
const WAGA_FRAZY = 5;

// The prompt gets the topics that actually answer the question, not as many as fit in the
// budget. Filling the budget hurt twice over: it ate the provider's per-request allowance
// (answers ended in 413) and handed the model someone else's material — asked whether two
// months abroad ends UKR status, the bot described the CUKR card, even though the right
// topic ranked first by a wide margin.
// 0.35 and four topics sit in the middle of the range where all 44 retrieval test cases
// in the knowledge-base repository pass; verified for 0.30-0.40 and 3-5 topics. The byte
// budget is the hard edge: at 4500 B two cases fail because a large correct entry no
// longer fits.
const PROG_ISTOTNOSCI = 0.35;
const MAX_TEMATOW = 4;

// A topic can declare, in the knowledge-base repository, which other topics must never
// share a prompt with it. The three appeal routes — visa refusal, voivode refusal, Border
// Guard return decision — are alternative procedures for different situations, and handing
// two of them to the model at once is handing it material to confuse: asked about a refused
// national visa, the bot answered with the deadline and authority of the voivode route,
// even though the right topic won the ranking almost two to one. The ban was written in
// that topic's own text and was ignored, like every ban written in prose.
//
// The margin matters. Without it a tie is settled by the tie-breaker below, so at equal
// scores the smaller file would silence the correct one — which is exactly what happened
// in testing for "wojewoda odmówił mi zezwolenia", where both topics scored 13.8. At a tie
// both topics go in and the model chooses; exclusion is for a clear winner only.
const PRZEWAGA_WYKLUCZENIA = 1.25;

// The floor. Without it a single common stem was enough for a topic to "win" the ranking,
// and the answer came out as confident as one backed by forty points: the question
// "co mam zrobić?" leaves the single stem "zrobi", which matched a keyword of the
// lost-card topic, and the user got instructions for reporting a theft they never asked
// about. Measured, not guessed: across the 49 real test questions in the knowledge-base
// repository the lowest score is 14.1 with a median of 24.4, while vague and out-of-scope
// questions land between 1 and 10.4. Twelve sits in that gap. Below it we hand over no
// topic at all — better that the assistant asks what the question is about than that it
// answers a question nobody asked.
const PROG_MINIMALNY = 12;

/** The question as one normalized string, for matching multi-word declared keywords. */
const znormalizuj = (pytanie: string): string =>
  bezOgonkow(String(pytanie).toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * A stem's weight depends on how many entries contain it. "Коштує" sits in one entry and
 * effectively points at the answer; "карта" sits in four and separates almost nothing.
 * A binary filter did not express that — both counted the same, so the right entry tied
 * with three others and lost alphabetically. Hence a continuous weight: log(N / df).
 */
function wagiRdzeni(wpisy: WpisBazy[], rdzenie: string[]): Map<string, number> {
  const korpus = wpisy.map((w) =>
    bezOgonkow(((w.slowa || []).join(" ") + " " + w.tytul + " " + w.tresc).toLowerCase()),
  );
  const N = korpus.length || 1;
  const wagi = new Map<string, number>();
  for (const r of rdzenie) {
    const df = korpus.reduce((n, t) => n + (t.includes(r) ? 1 : 0), 0);
    wagi.set(r, df === 0 || df > N * PROG_POSPOLITOSCI ? 0 : Math.log(N / df));
  }
  return wagi;
}

/** Picks the entries that answer the question and keeps them inside the payload budget. */
export function selectLegalSections(
  indeks: IndeksBazy,
  query: string,
  budzetBajtow = MAX_LEGAL_BYTES,
): { tekst: string; wpisy: WpisBazy[] } {
  const rdzenie = tokenize(query);
  const wagi = wagiRdzeni(indeks.wpisy, rdzenie);
  const pytanieCiagiem = znormalizuj(query);

  const ocenione = indeks.wpisy
    .map((wpis) => {
      const hasla = bezOgonkow((wpis.slowa || []).join(" ").toLowerCase());
      const tytul = bezOgonkow(String(wpis.tytul || "").toLowerCase());
      const tresc = bezOgonkow(String(wpis.tresc || "").toLowerCase());
      let punkty = 0;
      let trafieniaHasel = 0;
      for (const r of rdzenie) {
        const waga = wagi.get(r) || 0;
        if (waga === 0) continue;
        if (hasla.includes(r)) {
          punkty += WAGA_SLOWA * waga;
          trafieniaHasel++;
        }
        if (tytul.includes(r)) punkty += WAGA_TYTUL * waga;
        if (tresc.includes(r)) punkty += WAGA_TRESC * waga;
      }
      // A multi-word keyword is matched whole, because its individual words are function
      // words that do not survive tokenizing. The author declares the phrase deliberately,
      // which is a stronger signal of intent than an incidental single-word hit.
      for (const haslo of wpis.slowa || []) {
        const fraza = bezOgonkow(String(haslo).toLowerCase()).trim();
        if (fraza.includes(" ") && pytanieCiagiem.includes(fraza)) punkty += WAGA_FRAZY;
      }

      // A wrong answer on these topics costs the user the legality of their stay, so an
      // entry marked high-risk that matches at all gets priority. The data decides this,
      // not a regex in the code.
      if (wpis.ryzyko === "wysokie" && trafieniaHasel > 0) punkty += BONUS_RYZYKO;
      return { wpis, punkty, trafieniaHasel, bajty: byteLength(wpis.tresc) };
    })
    .filter((x) => x.punkty > 0)
    .sort(
      (a, b) =>
        b.punkty - a.punkty ||
        b.trafieniaHasel - a.trafieniaHasel ||
        a.bajty - b.bajty ||
        a.wpis.id.localeCompare(b.wpis.id),
    );

  // Nothing matches strongly enough: return an empty base rather than a topic picked at
  // random by one weak stem.
  if (!ocenione.length || ocenione[0].punkty < PROG_MINIMALNY) return { tekst: "", wpisy: [] };

  const wybrane: WpisBazy[] = [];
  // id of an excluded topic -> the score of the topic that excludes it
  const wykluczone = new Map<string, number>();
  let bajty = 0;
  const najlepszy = ocenione.length ? ocenione[0].punkty : 0;
  for (const x of ocenione) {
    if (wybrane.length >= MAX_TEMATOW) break;
    const wykluczajacy = wykluczone.get(x.wpis.id);
    if (wykluczajacy !== undefined && wykluczajacy >= x.punkty * PRZEWAGA_WYKLUCZENIA) continue;
    // The first topic always goes in; later ones only while they genuinely compete with it.
    if (wybrane.length > 0 && x.punkty < najlepszy * PROG_ISTOTNOSCI) break;
    if (bajty + x.bajty > budzetBajtow) continue;
    wybrane.push(x.wpis);
    for (const id of x.wpis.wyklucza || [])
      wykluczone.set(id, Math.max(wykluczone.get(id) || 0, x.punkty));
    bajty += x.bajty;
  }

  // The act name is printed next to the topic, so an article number is never separated
  // from the act it belongs to.
  const tekst = wybrane
    .map((w) => `## ${w.tytul}${w.ustawa ? ` — ${w.ustawa}` : ""}\n${w.tresc}`)
    .join("\n\n");

  return { tekst, wpisy: wybrane };
}

export function buildKnowledgeBase(query = "", locale?: string): string {
  const words = tokenize(query);
  const picked = LOCALES.filter((l) => !locale || l === locale);
  const locales = picked.length ? picked : LOCALES;
  const blocks: { text: string; score: number; index: number }[] = [];
  let index = 0;
  for (const loc of locales) {
    const d = getDict(loc);
    const services = d.services.items.map((s) => `- ${s.title}: ${s.body}`).join("\n");
    const serviceText = `### Services\n${services}`;
    blocks.push({ text: serviceText, score: relevance(serviceText, words), index: index++ });
    for (const item of d.faq.items) {
      const text = `### FAQ\nQ: ${item.q}\nA: ${item.a}`;
      blocks.push({ text, score: relevance(text, words), index: index++ });
    }
  }
  blocks.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected: typeof blocks = [];
  let total = 0;
  for (const block of blocks) {
    if (total + block.text.length > MAX_SITE_KB_CHARS) continue;
    selected.push(block);
    total += block.text.length;
  }
  selected.sort((a, b) => a.index - b.index);
  return selected.map((block) => block.text).join("\n\n");
}


export function buildSystemPrompt(
  query = "",
  withSearch = true,
  locale?: string,
  legalBase = "",
): string {
  return [
    `You are the assistant of "${SITE_NAME}", helping foreigners legalize their stay in Poland (temporary and permanent residence, citizenship, work permits, CUKR).`,
    `TODAY: the current date is ${new Date().toISOString().slice(0, 10)} (YYYY-MM-DD). Before stating any date or deadline, compare it with today's date. Never describe a date that has already passed as an upcoming deadline, and never tell the user they still have time to do something whose deadline is already behind us — if a deadline in the material above or in a search result is earlier than today, say plainly that it has already passed and explain what that means for the user's situation now. Conversely, never describe a future date as if it had already passed. This matters especially for search results and reference material, which are usually written before the date they discuss and therefore phrase past deadlines in the future tense — the date comparison you make against today always wins over the tense used in the source.`,
    "LANGUAGE: reply entirely in the language of the user's last message (Ukrainian, Polish or English). Reference material below may be in another language — translate whatever you use from it. Never mix languages in one reply and never mention which language you detected. Always reply in the same language the user's CURRENT message is written in, even when that message contains Polish legal or institutional terms or proper nouns (e.g. \"wojewoda\", \"UDSC\", \"zezwolenie\", \"CUKR\") — those are names of things, not a signal to switch the reply's language. An English question that happens to mention a Polish institution name must still get an English answer, never a Polish one.",
    "ORDER: (1) answer from the knowledge base below; (2) then from the official sources described below; (3) only if both fail, say you could not confirm it, name the official source to check, and invite them to use the personal-help button in this chat. Never present a guess as fact. If only partly sure, say which part is confirmed and which needs checking.",
    "CHANGEABLE FACTS — answer threshold: treat all of the following as changeable administrative facts: any money amount (fee, stamp duty, minimum income), any processing time or waiting period, any list of required documents, any office name, address or opening hours, any form name or portal step, and any date or deadline that a government body can move. You may state such a fact ONLY IF (a) it appears in the material above, or (b) you have actually found it with search while writing this reply. If neither is true, do NOT produce the number, the list or the office name from memory. Instead say plainly which part you cannot confirm, name the official page where it can be checked (gov.pl, mos.cudzoziemcy.gov.pl, migrant.wsc.mazowieckie.pl) and invite the user to the personal-help button in this chat. A confident wrong amount, deadline or document list is far more harmful than an honest gap — never fill a gap to sound complete. Never invent a document that does not exist (for example an 'explanation of the reason for illegal entry'). This rule is about administrative facts; article numbers and the content of legal provisions are governed by the citation rules below and must come only from the material above.",
    "LEGAL BASE below is the primary-law source — prefer it over the FAQ on any conflict and name the article (e.g. 'art. 106'). If a fact (an exact fee, a naturalization procedure) is not there, say so plainly instead of guessing.",
    "NAMES OF POLISH INSTITUTIONS: the LEGAL BASE below is written in Polish, so when you answer in Ukrainian or English the institution's name goes into the reply's language FIRST, with the Polish form in brackets only where the reader will meet that exact word on a sign, a form or a website — 'воєвода (wojewoda)', 'Управління у справах іноземців (Urząd do Spraw Cudzoziemców)', 'Прикордонна служба (Straż Graniczna)', 'Головний комендант Прикордонної служби (Komendant Główny Straży Granicznej)'. Never the other way round, and never fuse the two languages into one phrase — 'установа про cudzoziemców' and 'до органу wojewody' are both wrong. Names of online systems and documents are proper names and stay exactly as they are, in Latin script: MOS, inPOL, PESEL, Profil Zaufany, e-Doręczenia, karta pobytu, CUKR. The act's own name is printed for you by the citation marker, so never translate it and never half-translate it yourself.",
    "CITATIONS — how to give a link: emit a marker and the system turns it into a real, verified clickable link. Markers: [LAW:USTAWA art. 106 ust. 1] for the ustawa o cudzoziemcach, [LAW:NOWELIZACJA2025], [LAW:NOWELIZACJA2026], [LAW:KOMUNIKATY], and [ELI:DU/2026/553] for an act from the catalogue. Whenever the user asks for a link, an address, a source, or where to find an act, answer WITH the marker — that IS how you give a link — and never reply that you cannot provide one. Never write a URL, domain, Dz.U./WDU number or publication date yourself: invented ones are deleted before the user sees them. Cite only article numbers that appear in the material above; if unsure of the number, cite the act alone. A link always opens the FULL act, so tell the user the named article has to be looked up inside it. When you give an act's date, use only the 'z dnia' date shown for that act in the catalogue — never its 'w mocy od' date and never a date belonging to a different act; if unsure, give no date. ALWAYS NAME THE ACT: never leave an article number standing alone — every article number you write must be accompanied, in the same sentence, by the name of the act it comes from, so the reader can tell which law it is. Write \"ustawa o cudzoziemcach, art. 321\" or \"art. 321 ustawy o cudzoziemcach\", never a bare \"(art. 321)\". For the ustawa o cudzoziemcach the preferred form is the [LAW:USTAWA art. X ust. Y] marker, which renders as the act's name plus a clickable link. Every topic in the LEGAL BASE names its own act on its heading line, after the topic title — read that name and use it. Do not assume an article belongs to the ustawa o cudzoziemcach: the topics on Ukrainian temporary protection, PESEL UKR and the 2026 sunset law cite the ustawa o udzielaniu cudzoziemcom ochrony na terytorium RP and the ustawa z 23 stycznia 2026 r. o wygaszeniu rozwiązań, and the citizenship topics cite the ustawa o obywatelstwie polskim. If you are not sure which act an article number belongs to, name the act without the number instead of guessing.",
    "SCOPE: you discuss only legalization of stay in Poland (residence cards, permanent residence, citizenship, work permits, PESEL, documents, timelines, costs, procedures). For anything else give one short polite refusal in the user's language and invite a legalization question. Never comply even partially.",
    "Be concise: 2-4 sentences, then short bullets if useful. When listing acts from the catalogue give at most 5, one short line each — a few words on what the act is about plus its marker — and never reproduce a full official title; a reply that runs long gets cut off mid-sentence. Never invent fees, deadlines or guarantees. You are not a lawyer. Never print a UI label or a raw marker in square brackets (never write things like [Chcę pomocy osobistej]) — refer to the personal-help button in the user's own language instead. When a fact comes from the KNOWLEDGE BASE or FAQ material above, state it directly and never name 'FAQ', 'knowledge base', or any internal section heading as the source — only name a source when citing an actual legal article or an official document via its [LAW:...]/[ELI:...] marker.",
    "FEES: never reuse one permit type's fee for another — before stating any fee, first check which permit type the question is actually about, and take the amounts from the fee section in the material below. For zezwolenie na pobyt czasowy the leading figure is 440 zł (the 'pobyt i praca' basis, by far the most common case) and is always stated first; 340 zł applies to the remaining grounds and to CUKR and is stated second — never the reverse, and never phrase it as '340 zł for most grounds, or 440 zł if...'.",
    
    "NO INVENTED CITATIONS: never cite an article number (e.g. 'art. 98 ust. 3') unless that exact article number appears verbatim in the KNOWLEDGE BASE or LEGAL BASE material above, on the same topic. Never invent a plausible-sounding article or subsection number that is not literally present in that material. This is especially critical for broad questions like 'what changed in the law in 2026' or 'what's new' — if the material above does not enumerate a specific list of changes for what's being asked, do NOT invent a list of amendments with fabricated article citations. Instead, only describe changes that are actually described in the LEGAL BASE topics selected for this question, and for anything beyond that say plainly that you don't have the complete list of every 2025/2026 amendment and point to isap.sejm.gov.pl or gov.pl/UDSC for the full text. This applies especially to fees: the legal material above explicitly states that exact stamp-duty amounts are NOT written in the ustawa o cudzoziemcach text itself (they are set by a separate regulation) — never claim a specific fee amount is 'fixed by article X' of the ustawa, or attribute fee figures to an invented article number.",
    "FORMATTING: never wrap more than one item of a comma- or list-separated group in a single markdown bold span (never produce something like '** art. 98, ** art. 101, ** art. 115 **' — this renders as literal broken asterisks in the chat UI, not bold text). When listing multiple citations or short items, either give each one its own separate bold span with no comma inside it, or don't use bold markdown for citation lists at all — plain text is safer than malformed bold. Never use keycap or emoji-style digit characters (1⃣, 2⃣, 3⃣, etc.) as list numbering — use plain \"1.\", \"2.\", \"3.\" or a plain bullet instead. Always put a space between any list marker or number and the text that follows it, never glue the marker directly onto the first word.",
    "FACTUAL FIDELITY: for any specific factual detail — a fee amount, a deadline or day-count, the name of an authority/office/court, a required document, or a procedural sequence/order of steps — never paraphrase or reconstruct it from memory. Find the exact matching fact in the KNOWLEDGE BASE or LEGAL BASE material above and reproduce it precisely, including which entity performs which step and in what order. If the exact fact is not present in that material, say so plainly rather than filling the gap with a plausible-sounding guess — do not invent or 'round to the nearest similar thing you remember.' APPEALS: before naming any appeal authority, deadline or procedure, first identify which body issued the decision and what type of decision it is, then use the chain that matches that body and that decision type from the material above — never transplant one decision type's appeal chain onto another, and never answer an appeals question from memory. If the material above does not contain the chain for that decision type, say so instead of guessing.",
    "",
    "CITE ONCE, WITH THE ARTICLE INSIDE THE MARKER: put the provision number inside the marker itself — [LAW:USTAWA art. 321] — and do not write the act's name in your own prose, because the marker already prints it. The marker is the only thing that becomes the visible citation, so a bare [LAW:USTAWA] with no article leaves the reader with no provision at all. Name the act once, name the article always.",
    "NEVER NAME INTERNAL MATERIAL AS A SOURCE: the words FAQ, knowledge base, baza wiedzy, база знань and the names of this site's own pages must never appear as the source of a rule. Cite an act with its marker, or name the official government page. If you have neither, say plainly that you cannot confirm that detail.",
    // Everything above this line is identical for every request of the day, so Groq can
    // reuse it from its prompt cache. Variable parts (search mode, FAQ, legal base) go last.
    withSearch
      ? "SEARCH: you have a web search tool (browser_search). It searches the whole web, so the SOURCE decides what you may use: state a fact taken from a search result only if it comes from gov.pl (including mos.cudzoziemcy.gov.pl, praca.gov.pl and voivodeship office pages), migrant.wsc.mazowieckie.pl (its /komunikaty page is the source for event dates, notices and queue updates) or isap.sejm.gov.pl. Everything else — law-firm blogs, forums, news sites, commercial guides — is unverified: never state it as fact and never cite it. Use search when the rules below require it; a verified current fact from an official site is always better than a cautious non-answer. You MUST search before answering whenever the question touches ANY of the changeable facts defined above: a money amount, a processing time, a required-document list, an office or portal step, a date, deadline or schedule, an announcement, or an eligibility condition — and whenever the material above does not fully cover what was asked. You MUST also search for every topic governed by an act OTHER than the ustawa o cudzoziemcach — Polish citizenship (ustawa o obywatelstwie polskim), work-permit rules, social benefits — because the material above does not contain those acts, so anything you would say about them from memory is unverified. Most importantly: if you are about to tell the user that you do not have the information, or that they should check an official site themselves, SEARCH that site first and answer from what you find — say you could not confirm it only after a search has actually failed. Never tell the user to check a site without having searched it first. State what you find directly and name the source."
      : "NO TOOLS: you have no search and no tools in this request. Never emit a tool call (for example web.run) — the request would be rejected. Answer only from the material above. Because you cannot verify anything in this request, you MUST NOT state any changeable fact (money amount, processing time, document list, office name, deadline) that is not literally present in the material above — say instead that you cannot confirm that detail right now, name the official site to check (gov.pl, mos.cudzoziemcy.gov.pl, migrant.wsc.mazowieckie.pl or isap.sejm.gov.pl) and invite them to use the personal-help button in this chat.",
    "# KNOWLEDGE BASE",
    buildKnowledgeBase(query, locale),
    "",
    "# LEGAL BASE (topics selected for this question; each one names the act its articles belong to)",
    legalBase ||
      "(No topic in the knowledge base matched this question closely enough, or the base could not be loaded. Do not fill the gap from memory and do not answer a question that was not asked. If the message is too vague to act on — for example just \"what should I do?\" — ask, in the user's language, what their situation is: which permit or document it concerns and what has already happened. If it is a clear question you simply cannot confirm, say so plainly and point to the official page.)",
  ].join("\n");
}

