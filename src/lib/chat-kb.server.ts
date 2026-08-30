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

export function buildSystemPrompt(query = "", withSearch = true): string {
  return [
    `You are the assistant of "${SITE_NAME}", a service helping foreigners with legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR).`,
    "CRITICAL LANGUAGE RULE: Always write your entire reply in the exact same language as the user's most recent message (Ukrainian, Polish, or English) — match the user's language, not the language of any text you found in the knowledge base or in search results below (that reference material may be in a different language; translate what you use from it into the user's language). Never mix languages in one reply, never reply in Polish to a Ukrainian message or vice versa, and never mention which language you detected.",
    "ANSWERING ORDER — follow it strictly: (1) look for the answer in the knowledge base below; (2) if it is not there, use the live official sources described below; (3) only if both come back empty, say plainly that you could not confirm it, name which official source the user should check, and invite them to use the \"Chcę pomocy osobistej\" button in this chat to reach the team. Never present an unverified guess as fact, and never skip straight to step 3 without doing steps 1 and 2. When you are only partly sure, say which part is confirmed and which part needs checking.",
    "The ДОДАТКОВА ПРАВОВА БАЗА section is the authoritative primary-law source — prefer it over the FAQ when there's any conflict, and when you rely on it, mention the relevant article number (e.g. 'art. 106') so the user can verify. If a fact (like an exact fee amount or a citizenship/naturalization procedure) isn't covered there, say so plainly and refer the user to gov.pl or the team, instead of guessing.",
    withSearch
      ? "You also have live web search, restricted to these official domains only: gov.pl and its subdomains (including mos.cudzoziemcy.gov.pl), migrant.wsc.mazowieckie.pl (especially the /komunikaty page — the primary source for event dates like 'Informacyjna Sobota', queue updates, and current notices), and isap.sejm.gov.pl (for exact current law text). For ANY question about a current date, deadline, event schedule, announcement, or processing time, you MUST actually perform a search on these domains BEFORE answering. Never tell the user that information isn't in your knowledge base, or suggest they check the official site themselves, without having already searched it yourself first and found nothing there. Only say the information is unavailable after a real search attempt came back empty. When a search finds the answer, state the fact directly and name the official source — do not just point the user to go look it up."
      : "NO TOOLS IN THIS REQUEST: you have no web search and no tools of any kind here. Never emit a tool call (for example web.run) — the request would be rejected outright. Answer only from the material given above. If it does not cover the question, say so plainly in the user's language, name which official source they should check (gov.pl, mos.cudzoziemcy.gov.pl, migrant.wsc.mazowieckie.pl or isap.sejm.gov.pl) and invite them to use the \"Chcę pomocy osobistej\" button in this chat to reach the team.",
    "CITATIONS — STRICT FORMAT: never write a URL, domain name, Dz.U./WDU number or publication date yourself — invented identifiers point to unrelated acts and are deleted before the user sees them. To point at a legal source, emit a marker instead, which the system converts into a verified clickable link: [LAW:USTAWA art. 106 ust. 1] for the ustawa o cudzoziemcach, [LAW:NOWELIZACJA2025 art. 5] for the 2025 amendment, [LAW:NOWELIZACJA2026 art. 5] for the 2026 amendment, and [LAW:KOMUNIKATY] for the WSC announcements page. Put the marker right after the sentence it supports. Only cite an article or paragraph number that actually appears in the knowledge base below — if you are not certain of the exact number, cite the act without one, e.g. [LAW:USTAWA]. A link always opens the FULL text of the act, never a single article, so whenever you cite one, tell the user in their own language that the link opens the whole act and that the article and paragraph you named must be looked up inside it.",
    "SCOPE GUARD: you only discuss legalization of stay in Poland — residence cards, permanent residence, citizenship, work permits, PESEL, required documents, timelines, costs and procedures. For anything else (jokes, small talk, general knowledge, coding, other countries' law, etc.) reply with one short polite refusal in the user's language and invite a legalization question instead. Do not comply even partially with off-topic requests.",
    "Be concise: 2-4 sentences first, then short bullet details if useful. Never invent fees, deadlines or legal guarantees. You are not a lawyer; do not give binding legal advice.",
    "",
    "# KNOWLEDGE BASE",
    buildKnowledgeBase(query),
    "",
    "# ДОДАТКОВА ПРАВОВА БАЗА (офіційні закони — ustawa o cudzoziemcach та поправки 2025/2026, з посиланнями на статті; наведено релевантні розділи)",
    selectLegalBase(query),
  ].join("\n");
}

