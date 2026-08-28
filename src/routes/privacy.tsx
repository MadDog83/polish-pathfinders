import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/legal-pages";
import { getDict, SITE_URL } from "@/i18n";
const t = getDict("uk");
export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: t.meta.privacyTitle },
      { name: "description", content: t.meta.privacyDescription },
      { property: "og:title", content: t.meta.privacyTitle },
      { property: "og:description", content: t.meta.privacyDescription },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: () => <PrivacyPage locale="uk" />,
});
