# hntop

A Hacker News top stories client built with React, TypeScript, and Vite.

## Features

- Infinite-scrolling story list, sortable by top/new/hot score
- Search stories and filter by date range
- Story detail view with threaded comments
- AI-generated recaps of story discussions (via a Netlify function calling OpenRouter), with caching in Netlify Blobs
- Light/dark theme toggle

## Stack

- React 19 + React Router, styled with Tailwind CSS and Radix UI primitives
- TanStack Query for data fetching
- Netlify Functions for the recap API, deployed alongside the static site
- Vitest + Testing Library for tests

## Getting started

```bash
pnpm install
pnpm dev          # Vite dev server only
pnpm dev:netlify  # Vite + Netlify functions (needed for the recap feature)
```

The recap function requires an `OPENROUTER_API_KEY` environment variable.

## Scripts

- `pnpm dev` – start the Vite dev server
- `pnpm dev:netlify` – start Vite with Netlify Functions via `netlify dev`
- `pnpm build` – typecheck (`tsc -b`) and build for production
- `pnpm test` – run the test suite with Vitest
- `pnpm lint` – lint with ESLint
- `pnpm format` – format with Prettier
