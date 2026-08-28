import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getDict, LOCALES, type Locale } from "@/i18n";

function score(haystack: string, tokens: string[]): number {
  const h = haystack.toLowerCase();
  return tokens.reduce((acc, t) => (h.includes(t) ? acc + t.length : acc), 0);
}

export default defineTool({
  name: "search_faq",
  title: "Search legalization FAQ",
  description:
    "Search the public FAQ about legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR). Returns the matching questions with their full answers.",
  inputSchema: {
    query: z.string().min(2).describe("Question or keywords, in Ukrainian, English or Polish."),
    language: z
      .enum(["uk", "en", "pl"])
      .optional()
      .describe("Answer language. Defaults to searching all three languages."),
    limit: z.number().int().optional().describe("Maximum number of FAQ entries to return (default 3)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, language, limit }) => {
    const tokens = query
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2);
    const locales: Locale[] = language ? [language] : [...LOCALES];
    const max = Math.min(Math.max(limit ?? 3, 1), 10);

    const matches = locales
      .flatMap((locale) =>
        getDict(locale).faq.items.map((item) => ({
          locale,
          question: item.q,
          answer: item.a,
          score: score(`${item.q} ${item.a}`, tokens),
        })),
      )
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map(({ locale, question, answer }) => ({ locale, question, answer }));

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No FAQ entry matched. Always verify current rules on gov.pl, mos.cudzoziemcy.gov.pl or inpol.mazowieckie.pl.",
          },
        ],
        structuredContent: { results: [] },
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: matches.map((m) => `[${m.locale}] Q: ${m.question}\nA: ${m.answer}`).join("\n\n"),
        },
      ],
      structuredContent: { results: matches },
    };
  },
});
