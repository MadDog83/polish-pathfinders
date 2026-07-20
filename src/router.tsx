import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// GitHub Pages project-site base path. Must match the Vite `base` value in `vite.config.ts`.
const GITHUB_PAGES_BASEPATH = "/smart-legalization";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    basepath: GITHUB_PAGES_BASEPATH,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
