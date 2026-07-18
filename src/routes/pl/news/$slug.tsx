import { createFileRoute } from "@tanstack/react-router";
import { NewsDetailPage } from "@/components/news-detail-page";

export const Route = createFileRoute("/pl/news/$slug")({
  component: () => {
    const { slug } = Route.useParams();
    return <NewsDetailPage locale="pl" slug={slug} />;
  },
});
