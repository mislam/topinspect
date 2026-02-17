# SvelteKit Web App

SvelteKit web application with Svelte 5, TypeScript, and Tailwind CSS v4.

## How to access

Run `pnpm dev:web` from project root.
Open [https://app.localtest.cc](https://app.localtest.cc) (requires [Cloudflare Tunnel](../../README.md#cloudflare-tunnel)).

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Deploy**: Vercel (via `@sveltejs/adapter-vercel`)
- **Testing**: Vitest
- **Lint**: ESLint (flat config) + Prettier (root)

## Project Structure

```
src/
├── app.html          # HTML shell
├── app.d.ts          # App typings
├── routes/           # File-based routes (SvelteKit)
│   ├── +layout.svelte
│   ├── +layout.css
│   ├── +page.svelte
│   └── layout.css
├── lib/               # Shared code ($lib alias)
│   ├── index.ts
│   └── assets/
└── *.spec.ts          # Vitest tests
```

## Scripts

Run from monorepo root (e.g. `pnpm --filter @prism/web <script>`) or from `apps/web`:

| Script       | Description               |
| ------------ | ------------------------- |
| `dev`        | Start dev server (Vite)   |
| `build`      | Production build          |
| `preview`    | Preview production build  |
| `typecheck`  | Svelte + TypeScript check |
| `lint`       | Prettier check + ESLint   |
| `lint:fix`   | ESLint --fix              |
| `test`       | Vitest (single run)       |
| `test:watch` | Vitest (watch)            |

Formatting is handled at the repo root: `pnpm format`.

## Environment

Configure via `.env` (and `.env.production` for build). See SvelteKit [environment variables](https://kit.svelte.dev/docs/modules#$env-static-private) docs. Add API base URL and other env as needed when integrating with the Hono API.
