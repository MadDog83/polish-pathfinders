import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { getDict } from "@/i18n";

const t = getDict("pl");

export const Route = createFileRoute("/pl/")({
  head: () => ({
    meta: [
      { title: t.meta.homeTitle },
      { name: "description", content: t.meta.homeDescription },
      { property: "og:title", content: t.meta.homeTitle },
      { property: "og:description", content: t.meta.homeDescription },
      { property: "og:locale", content: "pl_PL" },
    ],
    links: [
      { rel: "canonical", href: "/pl" },
      { rel: "alternate", hrefLang: "uk", href: "/" },
      { rel: "alternate", hrefLang: "en", href: "/en" },
      { rel: "alternate", hrefLang: "pl", href: "/pl" },
      { rel: "alternate", hrefLang: "x-default", href: "/" },
    ],
  }),
  component: () => <HomePage locale="pl" />,
});
