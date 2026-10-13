@AGENTS.md

# Smart Legalization Support (polish-pathfinders)

Serwis informacyjny o legalizacji pobytu cudzoziemców w Polsce: strona w trzech językach
(UA domyślny, EN, PL), asystent AI odpowiadający na podstawie bazy wiedzy prawnej,
aktualności z UdSC i panel admina. TanStack Start + React 19, Supabase (Lovable Cloud),
Tailwind v4 + shadcn/ui, hosting na Cloudflare Workers (preset nitro `cloudflare-module`).

## Lovable — zasady pracy z repo

- Projekt jest połączony z Lovable. **Nie przepisuj opublikowanej historii** (force push,
  rebase, amend, squash już wypchniętych commitów) — Lovable straci historię projektu.
- Każdy commit na gałęzi połączonej z Lovable musi się budować — trafia do edytora.
- Pliki generowane — nie edytuj ręcznie:
  - `src/routeTree.gen.ts` (router),
  - `src/integrations/supabase/*` (nagłówek „automatically generated”, w tym `types.ts`),
  - `src/routes/mcp.ts`, `src/routes/[.mcp]/*`, `src/routes/[.well-known]/*` (plugin `@lovable.dev/mcp-js`).
- `vite.config.ts`: `@lovable.dev/vite-tanstack-config` już dodaje tanstackStart, React,
  Tailwind, aliasy i nitro. Nie dodawaj tych pluginów drugi raz — aplikacja się wysypie.
- `.lovable/plan.md` to pierwotny plan, nie aktualna dokumentacja (np. słowniki i18n są
  w jednym pliku, a nie w `src/i18n/{uk,en,pl}.ts`). Wierz kodowi.

## Polecenia

```bash
bun install                      # w Lovable; poza nim rejestr z bun.lock zwraca 403, wtedy:
npm install --no-package-lock --ignore-scripts --registry https://registry.npmjs.org
npx tsc --noEmit -p .            # musi przejść bez błędów
npx eslint <zmienione pliki>     # patrz uwaga niżej
npx vite build                   # build pod Cloudflare (.output/)
npx vite dev --host 127.0.0.1    # w sandboxie bez --host serwer pada na IPv6 (EAFNOSUPPORT)
```

- Nie commituj `package-lock.json` ani `node_modules` — źródłem prawdy jest `bun.lock`.
- Repo ma ~670 starszych błędów lintera (prawie wszystkie to formatowanie Prettiera). **Nie formatuj całych plików** (zaśmieca diff
  i historię w Lovable) — pilnuj tylko, żeby zmienione pliki nie dostały nowych błędów.
- Nie ma testów automatycznych w tym repo. Logikę sprawdzaj małym skryptem w Node,
  endpointy — `curl` na serwerze deweloperskim.

## Routing i języki

- Routing plikowy TanStack (`src/routes/README.md`). Jedyny layout główny to `__root.tsx`.
- **Każda strona istnieje trzy razy**: `/x` (UA), `/en/x`, `/pl/x` — osobne pliki tras,
  które renderują wspólny komponent z `src/components/` z propsem `locale`.
  Nowa strona = trzy pliki tras, każdy z własnym `head()`: title, description, OG,
  `canonical` i `hreflang` dla uk/en/pl + `x-default` → UA. Dopisz ją też do
  `STATIC_PATHS` w `src/routes/sitemap[.]xml.ts`.
- Wszystkie teksty interfejsu są w `src/i18n/index.ts`: interfejs `Dict` + słowniki
  `UA`, `EN`, `PL`. Nowy klucz dodajesz do interfejsu i do **wszystkich trzech** słowników.
- `SITE_NAME = "Smart Legalization Support"` — nigdy nie tłumaczony.
- Język z adresu: `useLocale()` / `localeFromPath()` (`src/lib/use-locale.ts`),
  linki przez `localePath(locale, path)`.
- `SITE_URL` (i18n) i `BASE_URL` (sitemap) to ta sama domena w dwóch miejscach — zmieniaj obie.
- Kolory tylko przez tokeny semantyczne (`bg-background`, `text-foreground`…) ze
  `src/styles.css`; ciemny motyw to klasa `.dark` ustawiana skryptem w `__root.tsx`.

## Kod serwerowy

- Funkcje serwerowe: `createServerFn` w plikach `src/lib/*.functions.ts`. **Te pliki trafiają
  też do paczki przeglądarki**, więc moduły serwerowe importuj dynamicznie wewnątrz
  handlera: `const { x } = await import("@/lib/x.server")`. Moduły tylko serwerowe nazywaj
  `*.server.ts`. Nie używaj pakietu `server-only` (blokuje to ESLint).
- `supabaseAdmin` (`client.server.ts`) używa klucza service role i **omija RLS**. Każda
  funkcja admina musi mieć middleware `requireSupabaseAuth` i sprawdzić `checkIsAdmin`
  po stronie serwera — ochrona `/_authenticated` w przeglądarce to tylko UX.
- Wejście waliduj zodem w `.inputValidator(...)`.
- Publiczne funkcje, które kosztują (LLM) albo zapisują dane, mają limit na IP:
  `enforceRateLimit(...)` z `src/lib/rate-limit.server.ts` (w pamięci, per instancja).
  Rzuca `RATE_LIMITED` — panel czatu rozpoznaje ten tekst w komunikacie błędu.
- Sekrety (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEWS_DIGEST_SECRET`) są tylko
  w sekretach Lovable Cloud. `.env` jest w repo i może zawierać **wyłącznie** wartości
  publiczne (URL, klucz publishable, ID projektu).

## Baza danych (Supabase)

- Migracje: `supabase/migrations/RRRRMMDDHHMMSS_<uuid>.sql`. Nigdy nie edytuj migracji,
  która już była zastosowana — dopisz nową.
- Migracja dodana przez git może nie zostać uruchomiona automatycznie przez Lovable.
  Po dodaniu migracji powiedz użytkownikowi, że trzeba ją zastosować i sprawdzić.
- Każda nowa tabela: `ENABLE ROW LEVEL SECURITY` + polityki + jawne `GRANT`.
- Role admina: tabela `user_roles`. W politykach sprawdzaj admina przez
  `EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')`
  (jak polityki `news`). `private.has_role` nie jest wykonywalne dla roli `authenticated`.
- `leads` zapisuje wyłącznie `submitLead` (service role); `anon` nie ma prawa INSERT.
- `news.is_published = false` to szkic — widzi go tylko admin.

## Asystent AI — najważniejsze reguły

Kod: `src/lib/chat.functions.ts` (wywołanie modeli, cytaty), `src/lib/chat-kb.server.ts`
(wybór tematów do promptu), `src/components/chat/chatbot-panel.tsx` (UI).

- **Treść prawna nie mieszka w tym repo.** Źródłem jest repo `MadDog83/kb-smartlegal`
  (`tresc/*.md` → `index/kb-index.json`); aplikacja pobiera indeks z gałęzi `main`
  przez raw.githubusercontent.com i trzyma go w pamięci 6 h. Poprawka przepisu = zmiana
  w tamtym repo, bez wdrażania aplikacji. `src/lib/legal-kb.server.ts` to nieużywana
  stara baza — nie rozwijaj jej.
- **Model nigdy nie wprowadza adresów URL.** Linki powstają tylko z markerów
  `[LAW:...]` i `[ELI:...]`, które `sanitizeCitations` zamienia na adresy z białych list
  `LAW_LINKS` / `ACT_URLS`. Numery artykułów spoza wybranej bazy są usuwane.
  Nowy adres na białą listę dodawaj tylko zweryfikowany — zły link jest gorszy niż brak linku.
- **Budżet tokenów jest ciasny** (darmowy plan Groq, wspólny z digestem newsów):
  ostatnie 4 tury, wcześniejsze odpowiedzi ucięte do 700 znaków, baza prawna ≤ 5000 B,
  katalog aktów doklejany tylko przy pytaniach o akty. Każde wydłużenie promptu
  uzasadnij. Kaskada modeli: 429 → cooldown i następny model; 400/404/413 → następny model.
- Progi i wagi wyboru tematów (`PROG_*`, `WAGA_*`, `MAX_TEMATOW`) są dostrojone pod
  przypadki testowe z `kb-smartlegal` (`node tools/test-retrieval.mjs`; komentarze w kodzie
  mówią o 44, zestaw ma już więcej). Zmieniając je, zachowaj zgodność z `tools/retrieve.mjs`
  w tamtym repo i uruchom te testy — wszystkie muszą trafiać.
- Odpowiedź musi być w języku pytania (uk/pl/en) — pilnuje tego dopisek w ostatniej
  wiadomości i `detectReplyLanguage`.
- Długie komentarze w kodzie czatu opisują realne błędy z produkcji (zły artykuł,
  zmiana języka, 413). Nie upraszczaj tych heurystyk ani nie usuwaj komentarzy bez
  zrozumienia, przed czym chronią.
- Asystent to informacja ogólna, nie porada prawna — zachowaj disclaimer.

## Aktualności i digest

- `POST /api/public/hooks/news-digest` (cron raz w tygodniu): pobiera komunikaty UdSC
  z gov.pl, LLM streszcza je na uk/pl/en i zapisuje jako **szkice**. Kod nigdy nie
  publikuje — publikuje admin w `/admin`.
- Autoryzacja: nagłówek `x-cron-secret` = `NEWS_DIGEST_SECRET`. Dopóki sekret nie jest
  ustawiony, endpoint akceptuje publiczny klucz (tryb przejściowy, z ostrzeżeniem w logu).

## Bezpieczeństwo — reguły przy zmianach

- JSON-LD: zawsze `jsonLd(value)` z `src/lib/utils.ts`, nigdy goły `JSON.stringify`
  w `dangerouslySetInnerHTML`.
- Przekierowania po logowaniu tylko przez `safeNext` (`src/routes/auth.tsx`).
- Dane kontaktowe (e-mail, telefon, Telegram) pokazuj tylko w panelu czatu po stronie
  klienta, nie w HTML renderowanym na serwerze.
- Markdown z modelu renderuje `react-markdown` bez `rehype-raw` — nie włączaj surowego HTML.

## Znane otwarte sprawy

- Formularz kontaktowy w czacie nic nie wysyła (`return;` na początku `handleSubmit`
  w `chatbot-panel.tsx`) — decyzja właściciela, czy go włączyć, czy ukryć.
- Brak nagłówków CSP / `frame-ancestors` (ważne dla `/.lovable/oauth/consent`).
- Polityki RLS dla `leads`, `user_roles`, `job_state` nadal wołają `private.has_role` —
  do sprawdzenia na prawdziwej bazie i zamiany na `EXISTS (...)`.
