import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getDict } from "@/i18n";

export default defineTool({
  name: "list_services",
  title: "List services",
  description:
    "List the legalization services offered by Smart Legalization Support, with a short description of each, in the requested language.",
  inputSchema: {
    language: z.enum(["uk", "en", "pl"]).optional().describe("Language of the output (default 'en')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ language }) => {
    const d = getDict(language ?? "en");
    const items = d.services.items.map((s) => ({ title: s.title, description: s.body }));
    return {
      content: [{ type: "text", text: items.map((s) => `- ${s.title}: ${s.description}`).join("\n") }],
      structuredContent: { services: items },
    };
  },
});
