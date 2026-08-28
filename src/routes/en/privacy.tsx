import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/legal-pages";
import { getDict, SITE_URL } from "@/i18n";
const t = getDict("en");
export const Route = createFileRoute("/en/privacy")({
  head: () => ({
    meta: [
      { title: t.meta.privacyTitle },
      { name: "description", content: t.meta.privacyDescription },
      { property: "og:title", content: t.meta.privacyTitle },
      { property: "og:description", content: t.meta.privacyDescription },
      { property: "og:url", content: `${SITE_URL}/en/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/en/privacy` }],
  }),
  component: () => <PrivacyPage locale="en" />,
});
