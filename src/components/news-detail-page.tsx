import { Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDict, localePath, type Locale } from "@/i18n";
import { getNewsBySlug } from "@/lib/news.functions";

export function NewsDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const t = getDict(locale);
  const fn = useServerFn(getNewsBySlug);
  const { data, isLoading } = useQuery({
    queryKey: ["news", locale, slug],
    queryFn: () => fn({ data: { language: locale, slug } }),
  });

  if (!isLoading && !data) throw notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Button variant="ghost" asChild className="-ml-3 mb-4">
        <Link to={localePath(locale, "/news")}>{t.news.back}</Link>
      </Button>
      {data && (
        <>
          <div className="text-sm text-muted-foreground">
            {new Date(data.published_at).toLocaleDateString(locale)}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{data.summary}</p>
          {data.body && (
            <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-base leading-relaxed text-foreground dark:prose-invert">
              {data.body}
            </div>
          )}
          {data.source_url && (
            <p className="mt-8 text-sm">
              <a
                href={data.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {t.news.source} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          )}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                headline: data.title,
                description: data.summary,
                datePublished: data.published_at,
                inLanguage: locale,
              }),
            }}
          />
        </>
      )}
    </article>
  );
}
