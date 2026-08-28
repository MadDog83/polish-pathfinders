import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchFaqTool from "./tools/search-faq";
import listServicesTool from "./tools/list-services";
import listNewsTool from "./tools/list-news";
import getNewsArticleTool from "./tools/get-news-article";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "smart-legalization-support",
  title: "Smart Legalization Support",
  version: "0.1.0",
  instructions:
    "Tools for Smart Legalization Support — legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR). Use `search_faq` for procedural questions, `list_services` for the service catalogue, and `list_news`/`get_news_article` for published updates. Answer in the user's language. This is general information, not legal advice — always point users to gov.pl, mos.cudzoziemcy.gov.pl or inpol.mazowieckie.pl to verify.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchFaqTool, listServicesTool, listNewsTool, getNewsArticleTool],
});
