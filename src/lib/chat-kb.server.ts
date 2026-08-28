import { LEGAL_KNOWLEDGE_BASE } from "@/lib/legal-kb.server";
import { getDict, LOCALES, SITE_NAME } from "@/i18n";

export function buildKnowledgeBase(): string {
  const blocks: string[] = [];
  for (const locale of LOCALES) {
    const d = getDict(locale);
    const services = d.services.items.map((s) => `- ${s.title}: ${s.body}`).join("\n");
    const faq = d.faq.items.map((i) => `Q: ${i.q}\nA: ${i.a}`).join("\n\n");
    blocks.push(`### [${locale.toUpperCase()}] Services\n${services}\n\n### [${locale.toUpperCase()}] FAQ\n${faq}`);
  }
  return blocks.join("\n\n");
}

const MAX_LEGAL_CHARS = 14000;

function splitSections(text: string): string[] {
  const parts = text.split(/\n(?=#{1,3} )/g).filter((p) => p.trim().length > 0);
  return parts.length > 1 ? parts : [text];
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
  for (const item of scored) {
    if (total + item.section.length > MAX_LEGAL_CHARS) continue;
    picked.push(item);
    total += item.section.length;
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
    buildKnowledgeBase(),
    "",
    "# ДОДАТКОВА ПРАВОВА БАЗА (офіційні закони — ustawa o cudzoziemcach та поправки 2025/2026, з посиланнями на статті; наведено релевантні розділи)",
    selectLegalBase(query),
  ].join("\n");
}

