import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/legal-pages";
import { getDict, SITE_URL } from "@/i18n";
const t = getDict("uk");
export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: t.meta.termsTitle },
      { name: "description", content: t.meta.termsDescription },
      { property: "og:title", content: t.meta.termsTitle },
      { property: "og:description", content: t.meta.termsDescription },
      { property: "og:url", content: `${SITE_URL}/terms` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/terms` }],
  }),
  component: () => <TermsPage locale="uk" />,
});
