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
    const history = data.messages.slice(-8);
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

    const messages = [
      { role: "system", content: buildSystemPrompt(lastUser) },
      ...history,
    ];

    const buildBody = (model: string, withSearch: boolean) =>
      JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        ...(withSearch
          ? {
              search_settings: {
                include_domains: [
                  "www.gov.pl",
                  "*.gov.pl",
                  "mos.cudzoziemcy.gov.pl",
                  "migrant.wsc.mazowieckie.pl",
                  "isap.sejm.gov.pl",
                ],
              },
            }
          : {}),
        messages,
      });

    // Primary model adds live official-source search; the fallback has a separate
    // quota, so a rate-limited primary still gets an answer instead of an error.
    const candidates: { model: string; withSearch: boolean }[] = [
      { model: "groq/compound-mini", withSearch: true },
      { model: "openai/gpt-oss-120b", withSearch: false },
    ];

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let res: Response | undefined;
    outer: for (const candidate of candidates) {
      const body = buildBody(candidate.model, candidate.withSearch);
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });

        if (res.ok) break outer;
        // Payload too large or rate-limited: this model can't serve the request right now, move to the fallback model.
        if (res.status === 413 || res.status === 429) break;
        // Any other non-retryable client error: no point trying the fallback, give up.
        if (res.status < 500) break outer;
        if (attempt === 2) break;

        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 8000)
          : 1000 * 2 ** attempt + Math.floor(Math.random() * 300);
        await sleep(waitMs);
      }
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
