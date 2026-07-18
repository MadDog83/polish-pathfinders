
# Smart Legalization Support — Multilingual Legalization Website

Discoverability-first (Google + ChatGPT/Perplexity) + always-current legalization info + rule-based chatbot. Every fact users need is static HTML; the chatbot is an accelerator, not the source. Business name **Smart Legalization Support** is used verbatim (English) in every locale.

## Routes

```
/                       Home — Ukrainian (default)
/en, /pl                Home — English / Polish
/news, /en/news, /pl/news       News list
/news/$slug (+/en, +/pl)         News article
/privacy, /terms (+/en, +/pl)    Legal pages
/auth                            Admin sign-in (email + password)
/_authenticated/admin            Admin dashboard
/sitemap.xml, /robots.txt, /llms.txt
```

Each locale route sets its own `head()` — unique title/description/OG/canonical + `hreflang` alternates for uk/en/pl (+ `x-default=uk`). Default language: Ukrainian at `/`.

## Content (static HTML)

All strings in typed dictionaries `src/i18n/{uk,en,pl}.ts` with `SITE_NAME = "Smart Legalization Support"` shared constant.

**FAQ**: your UA/EN/PL sets rendered verbatim — `<section>` per Q, `<h2>` = question, first paragraph = the 2–3 sentence answer. Emitted as `FAQPage` JSON-LD on each locale home.

**Home sections**: Hero (H1 with SITE_NAME) → Services → How it works → FAQ (verbatim) → News (3 latest per locale) → About (E-E-A-T; names Smart Legalization Support; cites Urząd Wojewódzki, Ustawa o cudzoziemcach, UDSC) → currency note "General info, current as of {date}; always verify on gov.pl."

**Footer**: © Smart Legalization Support, legal links, language switcher, theme toggle. No email/phone/Telegram in SSR HTML.

## Theme (light / dark)

- Both palettes defined as semantic HSL tokens in `src/styles.css`: light on `:root`, dark under `.dark` selector (`@custom-variant dark (&:where(.dark, .dark *))`). Every component references `bg-background`, `text-foreground`, `border-border`, `bg-card`, etc. — no hardcoded colors anywhere.
- Both palettes tuned to meet WCAG AA contrast for body text and interactive elements; verified with the shadcn foreground/muted-foreground pairings.
- Default = system preference. Persisted per user in `localStorage` under `sls-theme` (`light` | `dark` | `system`).
- **No-CLS / no-FOUC**: a tiny (~350 bytes) blocking inline script in the root shell `<head>` reads `localStorage` + `prefers-color-scheme` and sets `<html class="dark">` before first paint. `<html>` gets `suppressHydrationWarning`. `color-scheme: light dark` on `:root` so form controls/scrollbars match. Meta `theme-color` swapped via a client-side listener after hydration.
- **Toggle** in the header (right side, next to the language switcher): shadcn `Button size="icon"` with fixed 40×40 dimensions (no layout shift), `aria-label` reflecting current mode, sun/moon Lucide icons swapped via CSS (no JS re-render flicker). Cycles system → light → dark → system. Icons are inline SVG components — zero extra network requests, zero third-party JS.
- Chart colors, focus rings, and form controls read from tokens so admin dashboard adapts automatically.

## Chatbot (lazy, rule-based)

Fixed-size floating launcher only on first load. On click, `React.lazy` loads the panel + FAQ knowledge (same dictionary). Language matches active locale.

- Retrieval: token-overlap + fuzzy against verbatim FAQ questions → returns verbatim answer.
- Intent redirects: application filing → `https://mos.cudzoziemcy.gov.pl`, case status → `https://inpol.mazowieckie.pl`, general → `https://www.gov.pl/web/udsc`.
- Permanent disclaimer: "General info, not legal advice."
- **Advanced-help flow**: inline form (name, email OR phone, service, language, **required GDPR consent**) → `submitLead` server fn → on success, reveal placeholder email/phone + Telegram button `https://t.me/legalize_auto_bot`. Contact details render only in this client-only panel, never in SSR HTML.

## Backend (Lovable Cloud)

One migration creates:
- `leads(id, name, email, phone, service, language, consent bool not null, created_at)`
- `news(id, slug, title, summary, source_url, published_at, language, is_published, created_at)`
- `app_role` enum + `user_roles(user_id, role)` + `has_role()` security-definer.

**RLS + grants**
- `leads`: INSERT to `anon` + `authenticated`; SELECT admin-only via `has_role`.
- `news`: SELECT to `anon` for `is_published = true`; full access admin-only.
- `user_roles`: authenticated SELECT.

**Server functions** (`src/lib/*.functions.ts`)
- `submitLead` — public, zod-validated, server-side `consent === true` check.
- `listLeads`, `leadStats`, news CRUD — `.middleware([requireSupabaseAuth])` + `has_role('admin')` gate.
- Public news reads use publishable-key server client for SSR.

## Admin dashboard

Behind managed `_authenticated/` gate + additional `has_role('admin')` check. KPIs (total, 7d, 30d, by service, by language), Recharts time-series (code-split), sortable leads table + CSV export, news CRUD editor. Not linked from public nav.

## SEO / GEO

- Per-route `head()`: title, description, OG/Twitter, `og:url`, canonical, hreflang alternates.
- Root: `Organization` + `WebSite` JSON-LD, `og:site_name`.
- Locale homes: `LegalService` + `FAQPage` + `BreadcrumbList`.
- News articles: `Article` + `BreadcrumbList`.
- `sitemap.xml` server route: all locale roots, news list pages, all published articles, legal pages.
- `robots.txt`: explicit `Allow: /` for GPTBot, ChatGPT-User, PerplexityBot, Google-Extended, CCBot, Claude-Web + standard bots; admin/auth disallowed.
- `llms.txt`: curated topic → URL map.
- Semantic HTML, single `<h1>`, answer-first `<h2>`/`<h3>`.

## Performance

- No above-the-fold JS beyond React hydration + the ~350-byte theme init script.
- Chatbot, Recharts, admin, and news editor code-split.
- Self-hosted variable font: `<link rel="preload" as="font" crossorigin>` + `font-display: swap`.
- Hero image: `imagegen` WebP, explicit width/height, `fetchpriority="high"` preload on locale homes only.
- All other images `loading="lazy"` with dimensions.
- Zero third-party scripts on first load. Fixed-size chatbot launcher and theme toggle → no CLS.

## Privacy / GDPR

Privacy page names **Smart Legalization Support** as data controller. Server-side consent enforcement. Retention + user rights (access, rectification, erasure) in all three languages. No analytics / no third-party scripts → no cookie banner needed.

## Design

Calm, professional consulting/legal aesthetic (not the default purple-gradient Lovable look). Semantic tokens only — light + dark palettes tuned together. Sticky header: wordmark · nav · language switcher · theme toggle. Admin link visible only when signed in as admin.

## Implementation order

1. Enable Lovable Cloud; migration for `leads`, `news`, `user_roles`, `has_role`, RLS + grants.
2. Design tokens (light + dark) in `src/styles.css`; theme init script + toggle component; layout, header/nav, footer, language switcher.
3. i18n dictionaries with `SITE_NAME`; **PL/UA/EN FAQ pasted verbatim** + About + currency note.
4. Locale home routes with all sections, hreflang, JSON-LD.
5. News list + article routes per locale (SSR from `news`).
6. Privacy + Terms per locale.
7. Lazy chatbot (launcher, panel, FAQ retrieval, redirects, lead form + reveal-contact).
8. Server functions: `submitLead`, `listLeads`, `leadStats`, news CRUD.
9. `/auth` + `_authenticated/admin` (KPIs, chart, table, CSV, news editor). Pause here for you to sign up so I can grant your account admin.
10. `sitemap.xml`, `robots.txt`, `llms.txt`, per-route head + JSON-LD final pass.
11. Hero image + font preload + final perf pass; verify both themes at AA contrast and no CLS from the toggle.

## Notes

- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn.
- Auth: email + password only.
- FAQ content is used exactly as you provided in PL/UA/EN — no wording, fee, or deadline changes.
- After step 9 I'll ask for the email you signed up with and grant your user the `admin` role via a one-off SQL insert.

Approve to build.
