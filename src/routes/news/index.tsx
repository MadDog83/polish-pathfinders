import { createFileRoute } from "@tanstack/react-router";
import { NewsListPage } from "@/components/news-list-page";
import { getDict } from "@/i18n";

const t = getDict("uk");
export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: t.meta.newsTitle },
      { name: "description", content: t.meta.newsDescription },
      { property: "og:title", content: t.meta.newsTitle },
      { property: "og:description", content: t.meta.newsDescription },
    ],
    links: [
      { rel: "canonical", href: "/news" },
      { rel: "alternate", hrefLang: "uk", href: "/news" },
      { rel: "alternate", hrefLang: "en", href: "/en/news" },
      { rel: "alternate", hrefLang: "pl", href: "/pl/news" },
    ],
  }),
  component: () => <NewsListPage locale="uk" />,
});
