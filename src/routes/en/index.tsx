import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home-page";
import { getDict, SITE_URL } from "@/i18n";

const t = getDict("en");

export const Route = createFileRoute("/en/")({
  head: () => ({
    meta: [
      { title: t.meta.homeTitle },
      { name: "description", content: t.meta.homeDescription },
      { property: "og:title", content: t.meta.homeTitle },
      { property: "og:description", content: t.meta.homeDescription },
      { property: "og:locale", content: "en_US" },
    ],
        links: [
      { rel: "canonical", href: `${SITE_URL}/en` },
      { rel: "alternate", hrefLang: "uk", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/en` },
      { rel: "alternate", hrefLang: "pl", href: `${SITE_URL}/pl` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
    ],

  }),
  component: () => <HomePage locale="en" />,
});
