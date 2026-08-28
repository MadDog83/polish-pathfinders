import { createFileRoute } from "@tanstack/react-router";
import { NewsListPage } from "@/components/news-list-page";
import { getDict, SITE_URL } from "@/i18n";

const t = getDict("uk");
export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: t.meta.newsTitle },
      { name: "description", content: t.meta.newsDescription },
      { property: "og:title", content: t.meta.newsTitle },
      { property: "og:description", content: t.meta.newsDescription },
      { property: "og:url", content: `${SITE_URL}/news` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/news` },
      { rel: "alternate", hrefLang: "uk", href: `${SITE_URL}/news` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/en/news` },
      { rel: "alternate", hrefLang: "pl", href: `${SITE_URL}/pl/news` },
    ],
  }),
  component: () => <NewsListPage locale="uk" />,
});
