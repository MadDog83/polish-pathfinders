import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data) => ChatSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) throw new Error("GROQ_API_KEY missing");

    const { buildSystemPrompt } = await import("@/lib/chat-kb.server");

    // Keep the payload small: only recent turns + retrieval-narrowed knowledge base.
    const history = data.messages.slice(-4);
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

    const body = JSON.stringify({
      model: "groq/compound-mini",
      temperature: 0.2,
      max_tokens: 1200,
      search_settings: {
        include_domains: [
          "www.gov.pl",
          "*.gov.pl",
          "mos.cudzoziemcy.gov.pl",
          "migrant.wsc.mazowieckie.pl",
          "isap.sejm.gov.pl",
        ],
      },
      messages: [{ role: "system", content: buildSystemPrompt(lastUser) }, ...history],
    });

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let res: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
      });

      if (res.ok) break;
      // Retry only transient failures (rate limit / upstream errors).
      if (res.status !== 429 && res.status < 500) break;
      if (attempt === 2) break;

      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 8000)
        : 1000 * 2 ** attempt + Math.floor(Math.random() * 300);
      await sleep(waitMs);
    }

    if (!res || !res.ok) {
      const status = res?.status ?? 0;
      const detail = res ? await res.text() : "no response";
      console.error("Groq error", status, detail);
      if (status === 429) {
        throw new Error("RATE_LIMITED");
      }
      throw new Error(`Assistant unavailable (${status})`);
    }


    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty assistant response");
    return { text };
  });
