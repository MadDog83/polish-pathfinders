import { createFileRoute } from "@tanstack/react-router";
import { NewsDetailPage } from "@/components/news-detail-page";
import { SITE_URL } from "@/i18n";

export const Route = createFileRoute("/pl/news/$slug")({
  head: ({ params }) => ({
    meta: [
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE_URL}/pl/news/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pl/news/${params.slug}` }],
  }),
  component: () => {
    const { slug } = Route.useParams();
    return <NewsDetailPage locale="pl" slug={slug} />;
  },
});
