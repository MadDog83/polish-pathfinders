import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_news",
  title: "List published news",
  description:
    "List published news articles about legalization of stay in Poland, newest first, in the requested language.",
  inputSchema: {
    language: z.enum(["uk", "en", "pl"]).optional().describe("Language of the articles (default 'en')."),
    limit: z.number().int().optional().describe("Maximum number of articles to return (default 10, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ language, limit }) => {
    const supabase = supabaseAnon();
    const max = Math.min(Math.max(limit ?? 10, 1), 50);
    const { data, error } = await supabase
      .from("news")
      .select("slug, language, title, summary, source_url, published_at")
      .eq("language", language ?? "en")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(max);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    return {
      content: [
        {
          type: "text",
          text: rows.length
            ? rows.map((r) => `${r.published_at} — ${r.title} (/${r.slug})\n${r.summary ?? ""}`).join("\n\n")
            : "No published articles for this language.",
        },
      ],
      structuredContent: { articles: rows },
    };
  },
});
