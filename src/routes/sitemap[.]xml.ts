import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://smart-legalization.lovable.app";

const STATIC_PATHS = [
  "/", "/news", "/privacy", "/terms",
  "/en", "/en/news", "/en/privacy", "/en/terms",
  "/pl", "/pl/news", "/pl/privacy", "/pl/terms",
];

const PREFIX: Record<string, string> = { uk: "", en: "/en", pl: "/pl" };

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows } = await supabaseAdmin
          .from("news")
          .select("slug, language, updated_at, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        const entries: { path: string; lastmod?: string }[] = STATIC_PATHS.map((p) => ({ path: p }));

        for (const row of rows ?? []) {
          const prefix = PREFIX[row.language as string];
          if (prefix === undefined) continue;
          entries.push({
            path: `${prefix}/news/${row.slug}`,
            lastmod: (row.updated_at ?? row.published_at) ?? undefined,
          });
        }

        const urls = entries
          .map(
            (e) =>
              `<url><loc>${BASE_URL}${e.path}</loc>${
                e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""
              }<changefreq>weekly</changefreq></url>`,
          )
          .join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
