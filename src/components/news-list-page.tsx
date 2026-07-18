import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDict, localePath, type Locale } from "@/i18n";
import { listNewsPublic } from "@/lib/news.functions";

export function NewsListPage({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const listNews = useServerFn(listNewsPublic);
  const { data, isLoading } = useQuery({
    queryKey: ["news", locale, "all"],
    queryFn: () => listNews({ data: { language: locale, limit: 50 } }),
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t.news.heading}</h1>
      <p className="mt-2 text-muted-foreground">{t.news.lead}</p>
      <div className="mt-8 grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">…</p>}
        {(data ?? []).length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">{t.news.empty}</p>
        )}
        {(data ?? []).map((n) => (
          <Card key={n.id} className="border-border/60">
            <CardHeader>
              <div className="text-xs text-muted-foreground">
                {new Date(n.published_at).toLocaleDateString(locale)}
              </div>
              <CardTitle className="text-lg">
                <Link to={localePath(locale, `/news/${n.slug}`)} className="hover:underline">
                  {n.title}
                </Link>
              </CardTitle>
              <CardDescription>{n.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <Link to={localePath(locale, `/news/${n.slug}`)} className="text-primary hover:underline">
                {t.news.readMore}
              </Link>
              {n.source_url && (
                <a
                  href={n.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.news.source} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
