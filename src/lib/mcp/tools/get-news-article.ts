import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_news_article",
  title: "Get news article",
  description: "Fetch one published news article by its slug and language.",
  inputSchema: {
    slug: z.string().min(1).describe("Article slug, e.g. 'cukr-2027'."),
    language: z.enum(["uk", "en", "pl"]).optional().describe("Language of the article (default 'en')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, language }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("news")
      .select("slug, language, title, summary, source_url, published_at")
      .eq("slug", slug)
      .eq("language", language ?? "en")
      .eq("is_published", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No published article found for slug '${slug}'.` }], isError: true };

    return {
      content: [
        {
          type: "text",
          text: `${data.title}\n${data.published_at}\n\n${data.summary ?? ""}\n\nSource: ${data.source_url ?? "n/a"}`,
        },
      ],
      structuredContent: { article: data },
    };
  },
});
