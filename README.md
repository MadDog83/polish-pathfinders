<p align="center">
  <img src="./public/polish-pathfinders-logo.svg" alt="Polish Pathfinders" width="480">
</p>

<p align="center">
  <strong>Pomoc w legalizacji pobytu w Polsce</strong><br>
  Wielojęzyczna aplikacja webowa (UA · EN · PL) wspierająca osoby w formalnościach pobytowych.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TanStack_Start-EF4444?logo=react&logoColor=white" alt="TanStack Start">
  <img src="https://img.shields.io/badge/React_19-149ECA?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>

---

# Polish Pathfinders — Smart Legalization Support

A multilingual web app helping newcomers navigate residence-permit and legalization procedures in Poland. Built with TanStack Start, React 19, and Supabase.

## Features

- **Trilingual** — Ukrainian (default), English, and Polish, with localized routes (`/`, `/en`, `/pl`) and `hreflang` SEO tags
- **Authentication** — user accounts and protected routes powered by Supabase Auth
- **News section** — curated updates and articles
- **SEO-ready** — dynamic sitemap, canonical links, and Open Graph metadata
- **Legal pages** — privacy policy and terms of service

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (file-based routing) + React 19
- **Backend:** [Supabase](https://supabase.com) (auth + database)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Data:** TanStack Query, React Hook Form + Zod
- **Tooling:** Vite, TypeScript, ESLint, Prettier
- **Runtime:** Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Install dependencies
bun install

# Copy the example env file and fill in your Supabase credentials
cp .env.example .env

# Start the dev server
bun run dev
```

The app runs at `http://localhost:3000`.

### Environment Variables

Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |

## Project Structure

```
src/
├── components/       # UI components (shadcn/ui + custom)
├── hooks/            # Custom React hooks
├── i18n/             # Translation dictionaries (uk / en / pl)
├── integrations/     # Supabase client
├── lib/              # Utilities
└── routes/           # File-based routes (pages, auth, news, legal)
```

## Built with Lovable

This project was created with [Lovable](https://lovable.dev).
