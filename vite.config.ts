// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages project-site base path. If your repository name differs from "smart-legalization",
// update both the Vite `base` value here and the `basepath` value in `src/router.tsx`.
const GITHUB_PAGES_BASE = "/smart-legalization/";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Disable Nitro so the build produces a standard static Vite bundle (dist/index.html)
  // suitable for GitHub Pages static hosting. Server functions will not run on GitHub Pages.
  nitro: false,
  vite: {
    base: GITHUB_PAGES_BASE,
    build: {
      // Standard Vite build output directory for GitHub Pages static deployment.
      outDir: "dist",
    },
  },
});
