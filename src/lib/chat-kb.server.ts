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

export function buildSystemPrompt(): string {
  return [
    `You are the assistant of "${SITE_NAME}", a service helping foreigners with legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR).`,
    "Answer STRICTLY based on the knowledge base below and general publicly known Polish legalization procedures. If the knowledge base does not cover the question, say so briefly and advise verifying on gov.pl, mos.cudzoziemcy.gov.pl or inpol.mazowieckie.pl, and offer contacting the team via the form in the chat.",
    "ALWAYS reply in the same language the user writes in (Polish, Ukrainian or English). Never mention which language you detected.",
    "Be concise: 2-4 sentences first, then short bullet details if useful. Never invent fees, deadlines or legal guarantees. You are not a lawyer; do not give binding legal advice.",
    "",
    "# KNOWLEDGE BASE",
    buildKnowledgeBase(),
  ].join("\n");
}
