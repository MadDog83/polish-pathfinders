@AGENTS.md

# Working rules

## Lovable
- Every commit pushed to the Lovable-connected branch must build.
- Never hand-edit generated files: `src/routeTree.gen.ts`, `src/integrations/supabase/*`,
  `src/routes/mcp.ts`, `src/routes/[.mcp]/*`, `src/routes/[.well-known]/*`.
- Do not add Vite plugins that `@lovable.dev/vite-tanstack-config` already provides
  (TanStack Start, React, Tailwind, tsconfig paths, nitro): duplicates break the app.
- `.lovable/plan.md` is outdated. Trust the code.

## Tooling
- `bun install` fails outside Lovable (`bun.lock` points to a private registry, 403). Use
  `npm install --no-package-lock --ignore-scripts --registry https://registry.npmjs.org`
  and never commit `package-lock.json`.
- The repo has ~670 pre-existing Prettier errors. Never reformat whole files; only make
  sure the files you change gain no new errors.
- Before pushing, `npx tsc --noEmit -p .` and `npx vite build` must pass. There is no test suite.
- In the sandbox the dev server needs `--host 127.0.0.1` (IPv6 bind fails).

## i18n and routing
- Every page exists as three route files (UA at `/`, `/en`, `/pl`). Change all three; each
  needs its own canonical and hreflang (uk, en, pl, x-default → UA). New pages also go into
  `STATIC_PATHS` in the sitemap route.
- A new UI string goes into the `Dict` interface and all three dictionaries.
- Never translate `SITE_NAME`.
- `SITE_URL` (i18n) and `BASE_URL` (sitemap) must stay identical.
- No hardcoded colors; use the semantic tokens only.

## Server code
- `*.functions.ts` files are bundled for the browser too: import server-only modules
  dynamically inside the handler, and name server-only modules `*.server.ts`.
- `supabaseAdmin` bypasses RLS. Every admin server function needs `requireSupabaseAuth`
  and a server-side `checkIsAdmin`; the client-side route guard is UX only.
- Validate all server-function input with zod.
- Public functions that call the LLM or write data must call `enforceRateLimit`. Keep the
  error text `RATE_LIMITED`: the chat panel matches on it.
- Secrets live only in Lovable Cloud. `.env` is committed and may hold public values only.
- The chat lead form is disabled (`return;` in `handleSubmit`). Do not re-enable it
  without the owner's decision: it collects personal data.

## Database
- Never edit an applied migration; add a new one named `YYYYMMDDHHMMSS_<uuid>.sql`.
- Migrations pushed through git may not be applied automatically. Tell the user to
  apply and verify every new migration.
- Every new table: RLS enabled, explicit policies, explicit grants.
- In policies, check admin with `private.has_role(auth.uid(), 'admin')` (SECURITY DEFINER,
  executable by `authenticated`). Never query `user_roles` directly inside a `user_roles`
  policy: that recurses. Keep the `private` schema out of the API-exposed schemas.
- `anon` must never get INSERT on `leads`; only `submitLead` writes leads.

## Assistant
- Legal content lives in `MadDog83/kb-smartlegal` and is fetched at runtime from `main`.
  Fix legal facts there, not here; never reintroduce a legal base inside this repo.
  Index entries are schema-checked on load: when the index format changes, update
  `WpisSchema` in `src/lib/chat-kb.server.ts` in the same change.
- The model must never introduce URLs. Links come only from `[LAW:...]` / `[ELI:...]`
  markers expanded from the whitelists. Add a URL to a whitelist only after verifying
  it: a wrong link is worse than no link. Article numbers not found in the selected
  legal base must stay stripped.
- The token budget is tight (Groq free plan, shared with the news digest). Justify any
  prompt growth; keep the history trimming and size caps.
- Retrieval constants (`PROG_*`, `WAGA_*`, `MAX_TEMATOW`) must stay in sync with
  `tools/retrieve.mjs` in `kb-smartlegal`. After changing them, run
  `node tools/test-retrieval.mjs` there; every case must hit.
- Replies must be in the user's language (uk/pl/en).
- Long comments in the chat code document production incidents. Do not simplify those
  heuristics or delete the comments without understanding what they guard against.
- Keep the "general information, not legal advice" disclaimer. Never invent fees,
  deadlines or guarantees.

## News digest
- It only creates drafts (`is_published = false`). Never auto-publish.
- Auth is the `x-cron-secret` header = `NEWS_DIGEST_SECRET`. Accepting the public key
  while the secret is unset is transitional only; do not widen it.

## Security
- JSON-LD only through `jsonLd()`; never raw `JSON.stringify` in `dangerouslySetInnerHTML`.
- Post-login redirects only through `safeNext`.
- Contact details (email, phone, Telegram) never in server-rendered HTML; client-only chat panel.
- Never enable raw HTML in `react-markdown`.
- Keep `frame-ancestors` in `src/server.ts`; add a host there only if it must embed the site.
- Public server functions log database errors and return a generic message.
