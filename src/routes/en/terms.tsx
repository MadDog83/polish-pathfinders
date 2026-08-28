import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/legal-pages";
import { getDict, SITE_URL } from "@/i18n";
const t = getDict("en");
export const Route = createFileRoute("/en/terms")({
  head: () => ({
    meta: [
      { title: t.meta.termsTitle },
      { name: "description", content: t.meta.termsDescription },
      { property: "og:title", content: t.meta.termsTitle },
      { property: "og:description", content: t.meta.termsDescription },
      { property: "og:url", content: `${SITE_URL}/en/terms` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/en/terms` }],
  }),
  component: () => <TermsPage locale="en" />,
});
