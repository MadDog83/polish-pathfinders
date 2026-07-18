import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/legal-pages";
import { getDict } from "@/i18n";
const t = getDict("en");
export const Route = createFileRoute("/en/privacy")({
  head: () => ({ meta: [{ title: t.meta.privacyTitle }, { name: "description", content: t.meta.privacyDescription }] }),
  component: () => <PrivacyPage locale="en" />,
});
