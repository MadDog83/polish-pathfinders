import { LEGAL_KNOWLEDGE_BASE } from "@/lib/legal-kb.server";
import { getDict, LOCALES, SITE_NAME } from "@/i18n";

// groq/compound-mini enforces a small per-request size limit (413 request_too_large),
// so the prompt budget has to stay well below the previous 20k/15k figures.
const MAX_SITE_KB_CHARS = 2500; // now single-language, so ~3x more useful content fits
const MAX_LEGAL_CHARS = 4000;
const MAX_LEGAL_BYTES = 3000;
const ALWAYS_INCLUDE_COUNT = 2; // title/sources block + the permit-types overview, so the assistant keeps baseline knowledge of all residence-permit types even when keyword matching misses the right section for a specific message

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function tokenize(q: string): string[] {
  return Array.from(
    new Set(
      q
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    ),
  );
}

function relevance(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
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

function splitSections(text: string): string[] {
  const parts = text.split(/\n(?=#{1,3} )/g).filter((p) => p.trim().length > 0);
  return parts.length > 1 ? parts : [text];
}

/** Keeps only the legal sections relevant to the query so the prompt stays within provider payload limits. */
function selectLegalBase(query: string): string {
  const sections = splitSections(LEGAL_KNOWLEDGE_BASE);
  const words = tokenize(query);
  const scored = sections.map((section, index) => {
    const lower = section.toLowerCase();
    let score = 0;
    for (const w of words) if (lower.includes(w)) score += 1;
    return { section, index, score };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const picked: { section: string; index: number }[] = [];
  let total = 0;
  let totalBytes = 0;

  for (let i = 0; i < Math.min(ALWAYS_INCLUDE_COUNT, sections.length); i++) {
    picked.push({ section: sections[i], index: i });
    total += sections[i].length;
    totalBytes += byteLength(sections[i]);
  }

  for (const item of scored) {
    if (picked.some((p) => p.index === item.index)) continue;
    if (total + item.section.length > MAX_LEGAL_CHARS) continue;
    const sectionBytes = byteLength(item.section);
    if (totalBytes + sectionBytes > MAX_LEGAL_BYTES) continue;
    picked.push(item);
    total += item.section.length;
    totalBytes += sectionBytes;
    if (total > MAX_LEGAL_CHARS * 0.9) break;
  }
  picked.sort((a, b) => a.index - b.index);
  return picked.map((p) => p.section).join("\n");
}

export function buildSystemPrompt(query = "", withSearch = true, locale?: string): string {
  return [
    `You are the assistant of "${SITE_NAME}", helping foreigners legalize their stay in Poland (temporary and permanent residence, citizenship, work permits, CUKR).`,
    "LANGUAGE: reply entirely in the language of the user's last message (Ukrainian, Polish or English). Reference material below may be in another language — translate whatever you use from it. Never mix languages in one reply and never mention which language you detected.",
    "ORDER: (1) answer from the knowledge base below; (2) then from the official sources described below; (3) only if both fail, say you could not confirm it, name the official source to check, and offer the \"Chcę pomocy osobistej\" button in this chat. Never present a guess as fact. If only partly sure, say which part is confirmed and which needs checking.",
    "ДОДАТКОВА ПРАВОВА БАЗА below is the primary-law source — prefer it over the FAQ on any conflict and name the article (e.g. 'art. 106'). If a fact (an exact fee, a naturalization procedure) is not there, say so plainly instead of guessing.",
    withSearch
      ? "SEARCH: you have live search limited to gov.pl (including mos.cudzoziemcy.gov.pl), migrant.wsc.mazowieckie.pl (its /komunikaty page is the source for event dates, notices and queue updates) and isap.sejm.gov.pl. For any question about a current date, deadline, schedule, announcement or processing time you MUST search before answering. Never tell the user to check a site themselves without having searched it first. State what you find directly and name the source."
      : "NO TOOLS: you have no search and no tools in this request. Never emit a tool call (for example web.run) — the request would be rejected. Answer only from the material above; if it is not covered, say so, name the official site to check (gov.pl, mos.cudzoziemcy.gov.pl, migrant.wsc.mazowieckie.pl or isap.sejm.gov.pl) and offer the \"Chcę pomocy osobistej\" button.",
    "CITATIONS: never write a URL, domain, Dz.U./WDU number or publication date — invented ones are deleted before the user sees them. Use markers, which the system turns into verified links: [LAW:USTAWA art. 106 ust. 1], [LAW:NOWELIZACJA2025], [LAW:NOWELIZACJA2026], [LAW:KOMUNIKATY], or [ELI:DU/2026/553] for an act from the catalogue. Cite only article numbers that appear above; if unsure of the number, cite the act alone. A link always opens the FULL act, so tell the user the named article has to be looked up inside it.",
    "SCOPE: you discuss only legalization of stay in Poland (residence cards, permanent residence, citizenship, work permits, PESEL, documents, timelines, costs, procedures). For anything else give one short polite refusal in the user's language and invite a legalization question. Never comply even partially.",
    "Be concise: 2-4 sentences, then short bullets if useful. Never invent fees, deadlines or guarantees. You are not a lawyer.",
    "",
    "# KNOWLEDGE BASE",
    buildKnowledgeBase(query, locale),
    "",
    "# ДОДАТКОВА ПРАВОВА БАЗА (ustawa o cudzoziemcach + поправки 2025/2026, релевантні розділи)",
    selectLegalBase(query),
  ].join("\n");
}

