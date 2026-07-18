import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/legal-pages";
import { getDict } from "@/i18n";
const t = getDict("pl");
export const Route = createFileRoute("/pl/terms")({
  head: () => ({ meta: [{ title: t.meta.termsTitle }, { name: "description", content: t.meta.termsDescription }] }),
  component: () => <TermsPage locale="pl" />,
});
