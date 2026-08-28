import { defineMcp } from "@lovable.dev/mcp-js";
import searchFaqTool from "./tools/search-faq";
import listServicesTool from "./tools/list-services";
import listNewsTool from "./tools/list-news";
import getNewsArticleTool from "./tools/get-news-article";

export default defineMcp({
  name: "smart-legalization-support",
  title: "Smart Legalization Support",
  version: "0.1.0",
  instructions:
    "Public tools for Smart Legalization Support — legalization of stay in Poland (temporary residence card, permanent residence, citizenship, work permits, CUKR). Use `search_faq` for procedural questions, `list_services` for the service catalogue, and `list_news`/`get_news_article` for published updates. Answer in the user's language. This is general information, not legal advice — always point users to gov.pl, mos.cudzoziemcy.gov.pl or inpol.mazowieckie.pl to verify.",
  tools: [searchFaqTool, listServicesTool, listNewsTool, getNewsArticleTool],
});
