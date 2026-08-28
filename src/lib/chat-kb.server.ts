import { LEGAL_KNOWLEDGE_BASE } from "@/lib/legal-kb.server";
import { getDict, LOCALES, SITE_NAME } from "@/i18n";

const MAX_SITE_KB_CHARS = 5000;
const MAX_LEGAL_CHARS = 20000;
const MAX_LEGAL_BYTES = 15000;
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

export function buildKnowledgeBase(query = ""): string {
  const words = tokenize(query);
  const blocks: { text: string; score: number; index: number }[] = [];
  let index = 0;
  for (const locale of LOCALES) {
    const d = getDict(locale);
    const services = d.services.items.map((s) => `- ${s.title}: ${s.body}`).join("\n");
    const serviceText = `### [${locale.toUpperCase()}] Services\n${services}`;
    blocks.push({ text: serviceText, score: relevance(serviceText, words), index: index++ });
    for (const item of d.faq.items) {
      const text = `### [${locale.toUpperCase()}] FAQ\nQ: ${item.q}\nA: ${item.a}`;
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

export function buildSystemPrompt(query = ""): string {
  return [
    `You are the assistant of "${SITE_NAME}", a service helping foreigners with legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR).`,
    "Answer STRICTLY based on the knowledge base below and general publicly known Polish legalization procedures. If the knowledge base does not cover the question, say so briefly and advise verifying on gov.pl, mos.cudzoziemcy.gov.pl or inpol.mazowieckie.pl, and offer contacting the team via the form in the chat.",
    "The ДОДАТКОВА ПРАВОВА БАЗА section is the authoritative primary-law source — prefer it over the FAQ when there's any conflict, and when you rely on it, mention the relevant article number (e.g. 'art. 106') so the user can verify. If a fact (like an exact fee amount or a citizenship/naturalization procedure) isn't covered there, say so plainly and refer the user to gov.pl or the team, instead of guessing.",
    "ALWAYS reply in the same language the user writes in (Polish, Ukrainian or English). Never mention which language you detected.",
    "Be concise: 2-4 sentences first, then short bullet details if useful. Never invent fees, deadlines or legal guarantees. You are not a lawyer; do not give binding legal advice.",
    "",
    "# KNOWLEDGE BASE",
    buildKnowledgeBase(query),
    "",
    "# ДОДАТКОВА ПРАВОВА БАЗА (офіційні закони — ustawa o cudzoziemcach та поправки 2025/2026, з посиланнями на статті; наведено релевантні розділи)",
    selectLegalBase(query),
  ].join("\n");
}

