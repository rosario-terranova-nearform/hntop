# hntop

A Hacker News top stories client built with React, TypeScript, and Vite.

## Features

- Infinite-scrolling top stories list
- Search stories and filter by date range
- Story detail view with threaded comments
- Light/dark theme toggle

## Stack

- React 19 + React Router, styled with Tailwind CSS and Radix UI primitives
- TanStack Query for data fetching
- Static site deployed on Netlify
- Vitest + Testing Library for tests

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` – start the Vite dev server
- `pnpm build` – typecheck (`tsc -b`) and build for production
- `pnpm test` – run the test suite with Vitest
- `pnpm lint` – lint with ESLint
- `pnpm format` – format with Prettier
