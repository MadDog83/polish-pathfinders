# Polish Pathfinders

A multilingual web app helping newcomers find their way in Poland. Built with TanStack Start, React 19, and Supabase.

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
