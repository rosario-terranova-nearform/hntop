# HN Top — Spec

A React app for browsing Hacker News stories with Reddit-style time-window sorting (Day / Week / Month / Year / All), a comment thread view, and an AI-generated daily recap of the best stories.

## 1. Goals

- Let users sort HN stories by points within a chosen time window, similar to Reddit's "Top" sort.
- Support viewing a story's full comment thread inside the app (no need to leave for HN itself).
- Surface a short AI-generated recap of the day's best stories on the home page, generated once per day and cached, not regenerated per visitor (§9).
- Keep the app simple and fast. The story list, sorting, and comment threads need no backend at all; the one exception is a small serverless function that generates and caches the daily recap.

## 2. Data sources

### 2.1 Algolia HN Search API (primary — story listing)

Base URL: `https://hn.algolia.com/api/v1`

Used for the story list because it supports date-range filtering, which the official Firebase API does not.

**Endpoint:** `GET /search_by_date` or `GET /search`

Relevant params:

- `tags=story` — restrict to stories (excludes comments, polls, etc.)
- `numericFilters=created_at_i>{unixStart},created_at_i<{unixEnd}` — time window
- `page={n}` — pagination (0-indexed)
- `hitsPerPage={n}` — page size (default 20, we'll use 30–50)

Notes:

- Algolia does not support "sort by points" as a query param directly on `search_by_date`. Strategy: fetch a page of results within the time window (already time-filtered), then sort that page client-side by `points` descending. Because the app is API-driven per filter change, each time-window/page change triggers a fresh fetch + local sort of just that page's results (not the entire dataset).
- For "All time," omit the `numericFilters` lower bound, or use `search` (relevance-ranked default) as a base and sort by points.

### 2.2 Official Firebase API (secondary — comments)

Base URL: `https://hacker-news.firebaseio.com/v0`

Used for comment threads, since Algolia's comment data is sometimes structured differently and the official API tree structure (`kids` arrays) is the canonical source.

**Endpoints:**

- `GET /item/{id}.json` — a story or comment; comments include a `kids` array of child comment IDs.
- Fetch recursively/lazily as the user expands threads (see §5.3).

Alternative: Algolia also exposes `GET /items/{id}` which returns the full nested comment tree in one call. This is simpler (one request instead of N recursive calls) and is the preferred approach — fall back to the Firebase API only if Algolia's item endpoint is unavailable or incomplete.

### 2.3 OpenRouter (recap generation, server-side only)

Base URL: `https://openrouter.ai/api/v1`

Called only from the `recap` Netlify Function, never from the browser (the API key must not reach the client). Used to generate the daily recap's prose. See §9 for the full flow, prompt, storage, and model fallback.

## 3. Time window → date range mapping

Given "now" as `t0`:

| Window | Lower bound (`created_at_i >`) |
| ------ | ------------------------------ |
| Day    | t0 - 24h                       |
| Week   | t0 - 7d                        |
| Month  | t0 - 30d                       |
| Year   | t0 - 365d                      |
| All    | no lower bound                 |

Upper bound is always "now" (or omitted, since new stories are naturally in the past relative to the request).

## 4. URL / state design

All filter state lives in the URL query string so views are shareable and bookmarkable:

```
/?range=week&page=0
/item/{id}          → story detail + comments
```

Query params:

- `range`: `day | week | month | year | all` (default: `day`)
- `page`: integer, 0-indexed (default: `0`)

State management: no global store needed. Use React Router's `useSearchParams` as the source of truth; derive fetch parameters from it. React Query (`useQuery`) keyed on `[range, page]` handles caching, loading, and error state, and automatically refetches when the key changes.

The daily recap (§9) has no URL state of its own — it's derived entirely from `range === 'day'` and today's UTC date, not from a query param.

## 5. Routes & components

### 5.1 Routes

- `/` — story list (home)
- `/item/:id` — story detail with comment thread

### 5.2 Story list (`/`)

**`<SortControls />`**

- Segmented control / button group: Day, Week, Month, Year, All
- Updates `range` search param on click (resets `page` to 0)

**`<DailyRecap />`**

- Rendered immediately after `<SortControls />`, only when `range === 'day'`
- Fetches from the `recap` Netlify Function via a `useRecap` React Query hook, mirroring the `useStories`/`useItem` pattern
- Loading: skeleton in place of the callout, does not block `<StoryList />` from rendering
- Error or "no recap": renders nothing (silent fail — see §8, §9.5)
- Success: short intro paragraph followed by a one-line blurb per story, all shown inline (no collapse)

**`<StoryList />`**

- Reads `range` + `page` from URL
- `useQuery(['stories', range, page], fetchStories)`
- Renders loading skeleton, error state, or `<StoryCard />` list
- `<Pagination />` at the bottom (Prev / Next, or "Load more" appending to the list)

**`<StoryCard />`**
Displays per story:

- Rank/index within current page
- Title (links to external URL if present, otherwise to `/item/:id`)
- Domain (parsed from URL host)
- Points
- Author
- Relative age ("3 hours ago")
- Comment count → links to `/item/:id`

### 5.3 Story detail (`/item/:id`)

**`<StoryDetail />`**

- Fetches full item + nested comments via Algolia `items/{id}` endpoint
- `useQuery(['item', id], fetchItemWithComments)`
- Renders story header (same fields as `<StoryCard />`, plus full text if it's a "Ask HN"/"Show HN" post)

**`<CommentThread />`** (recursive)

- Renders a comment's author, age, HTML-decoded text (HN comment text is HTML; sanitize with a lightweight sanitizer like `dompurify` before rendering with `dangerouslySetInnerHTML`)
- Renders children recursively, indented
- Collapse/expand toggle per comment (local component state, not URL state — thread trees can be large)
- Since the full tree comes back in one API call, no lazy-loading of children is required; collapsing is purely a UI/display concern

## 6. Fetching layer

Centralize HN API calls in a small module, `src/api/hn.ts`:

```ts
async function fetchStories(
  range: Range,
  page: number,
): Promise<StoryListResult> {
  const params = new URLSearchParams({
    tags: "story",
    page: String(page),
    hitsPerPage: "30",
  });
  if (range !== "all") {
    const lowerBound = Math.floor(Date.now() / 1000) - RANGE_SECONDS[range];
    params.set("numericFilters", `created_at_i>${lowerBound}`);
  }
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?${params}`,
  );
  const data = await res.json();
  return {
    hits: [...data.hits].sort((a, b) => b.points - a.points),
    nbPages: data.nbPages,
    page: data.page,
  };
}

async function fetchItemWithComments(id: string): Promise<HNItem> {
  const res = await fetch(`https://hn.algolia.com/api/v1/items/${id}`);
  return res.json();
}
```

Wrap both in React Query hooks (`useStories`, `useItem`) for caching/retry/staleness config.

The recap fetch is a separate client module, `src/api/recap.ts`, that calls the `recap` Netlify Function (§9) rather than Algolia directly. Wrapped in a `useRecap` hook for the same caching/loading/error ergonomics.

## 7. Tech stack

- **React** (Vite scaffold)
- **React Router** — routes + URL-driven filter state
- **TanStack Query (React Query)** — data fetching, caching, loading/error states
- **dompurify** — sanitize comment HTML before render
- Styling: plain CSS or Tailwind (either works; no strong dependency either way)
- **Netlify Functions (Node)** — the only backend in the app; runs the `recap` function (§9). Everything else stays a static client-side SPA.
- **Netlify Blobs** — key-value storage for cached daily recaps (§9.3)
- **OpenRouter** — free-tier LLM API called server-side by the `recap` function (§9.4)
- Deployment: **Netlify**, git-integrated auto-deploy on push to `main`, default `*.netlify.app` subdomain, no router basename

## 8. Error handling & edge cases

- Algolia rate limits: no API key required for reasonable use, but add basic retry/backoff via React Query defaults.
- Empty result set (e.g., "Day" window with few qualifying stories): show an empty state, suggest widening the range.
- Deleted/dead stories or comments: Algolia items may have `null` text or a `deleted`/`dead` flag — render a "[deleted]" placeholder instead of blank space.
- Malformed URLs in stories (self-posts / Ask HN have no `url`): link to `/item/:id` instead of external link.
- Comment tree depth: very deep threads should not break layout — cap visual indentation (e.g., stop increasing indent past depth 6, but keep nesting logically).
- Recap generation failure (OpenRouter down, rate-limited, or malformed response after the fallback-model retry): the `<DailyRecap />` callout renders nothing; nothing is cached, so the next visitor's request retries generation from scratch (§9.4, §9.5).
- Fewer than 10 qualifying day-range stories: the recap uses however many exist; zero stories means no recap is generated or shown.
- Concurrent first-of-day requests: accepted possible duplicate OpenRouter call, no distributed locking (§9.2) — free-tier quota (50 requests/day, account-wide) comfortably covers the roughly one call/day this feature produces even with occasional duplicates.

## 9. Daily Recap feature

### 9.1 Overview

A short AI-generated recap of the day's best stories, shown as a callout on the home page when `range=day` is selected. Generated once per UTC day, on demand, by the first visitor whose request finds no cached recap yet; every subsequent visitor that day gets the cached result. Day-only for v1 — Week/Month/Year/All recaps are deferred (§10, T20).

### 9.2 Trigger & caching flow

1. `<DailyRecap />` calls the Netlify Function at `/.netlify/functions/recap` on mount, whenever `range === 'day'`.
2. The function computes today's UTC date key (`YYYY-MM-DD`) and reads blob `recaps/{date}` from Netlify Blobs.
3. Cache hit: return the stored recap directly, no LLM call.
4. Cache miss: fetch the top 10 day-range stories (same Algolia query/sort `fetchStories('day', 0)` already uses, taking the first 10 of the sorted result), build the prompt, call OpenRouter (§9.4), write the result to Blobs, return it.
5. No locking: two requests racing before either write completes may both call the LLM and both write the same key. Last write wins; this is accepted as a rare, harmless duplicate cost (§8).

### 9.3 Storage schema (Netlify Blobs)

- Store: `recaps` (global/site-wide, not deploy-scoped, so it persists across deploys and is shared by every function invocation).
- Key: UTC date, `YYYY-MM-DD`.
- Value (JSON):

```json
{
  "date": "2026-09-09",
  "intro": "short paragraph summarizing today's themes",
  "stories": [
    {
      "objectID": "123456",
      "title": "...",
      "url": "https://example.com/...",
      "points": 512,
      "blurb": "one-line reason this made today's list"
    }
  ],
  "model": "inclusionai/ling-3.0-flash-sante:free"
}
```

- Past days' recaps are retained indefinitely for internal history. No UI reads anything but today's key (§10 — no browsing UI in v1).

### 9.4 Prompt & model

- Input to the LLM: title, points, author, and domain for the top 10 day-range stories (fields already available from `fetchStories`). The LLM only writes prose — story selection is the existing points-sort, not an LLM judgment call.
- Output requested: one short intro paragraph plus one one-line blurb per story, in a fixed JSON shape matching §9.3.
- Model: OpenRouter `inclusionai/ling-3.0-flash-sante:free` (primary). On any failure (rate limit, timeout, malformed response), retry once against `nvidia/nemotron-3-super-120b-a12b:free` (fallback, different provider pool). If both fail, the function returns a "no recap available" response and caches nothing.
- If fewer than 10 qualifying stories exist for the day, use however many are available; zero stories skips generation entirely (no LLM call, no cache write).

### 9.5 UI

- `<DailyRecap />` (§5.2): callout after `<SortControls />`, visible only when `range === 'day'`.
- Loading: skeleton/shimmer, non-blocking — `<StoryList />` renders independently.
- Error/no-recap: renders nothing. A broken recap must never make the core app look broken.
- Success: intro paragraph, then each story's blurb inline underneath, linking the same way `<StoryCard />` would (external URL if present, else `/item/:id`).

## 10. Out of scope (v1)

- User accounts, voting, submitting stories/comments (HN API is read-only anyway; no write access exists).
- "Hot"/decayed-score sorting (possible v2 enhancement, see below).
- Search by keyword (could reuse the same Algolia endpoint later with a `query` param).
- Recaps for Week/Month/Year/All time windows — day-only for v1 (see T20 in the v2 backlog).
- Browsing historical daily recaps — past recaps are retained in storage (§9.3) but no UI reads them yet.

## 11. Possible v2 enhancements

- Add a keyword search box (Algolia `search` endpoint already supports `query`).
- Add a decayed "hot" score option alongside pure point-sort, using an HN/Reddit-style formula: `score = points / (age_hours + 2)^gravity`.
- Infinite scroll instead of pagination buttons.
- Persist last-used sort/range in localStorage as the default landing state (URL param still takes precedence if present).
- Extend AI recap generation to Week/Month/Year/All windows, each regenerated on its own cadence (T20).
- Historical recap browsing UI, surfacing the archive of past daily recaps already retained in storage (§9.3).

## 12. Tickets — v1

Stack decisions locked in for these tickets: TypeScript, Tailwind v4 + shadcn/ui, pnpm, React Router v7, TanStack Query, Vitest + React Testing Library, Netlify deployment (default subdomain, no base path), Netlify Functions + Netlify Blobs for the recap backend, OpenRouter for recap generation.

After implementing a ticket, apply a check ✅ in the relative title.

### T1 — Project scaffold ✅

**Description:** Bootstrap the app: Vite + React + TypeScript template, pnpm as package manager, Tailwind v4 + shadcn/ui initialized (base color, CSS variables), React Router v7 and TanStack Query installed, Vitest + React Testing Library configured. (Originally scoped a `/hntop/` base path for GitHub Pages; superseded by the Netlify decision (T9) — the app is served from the site root with no basename.)

**Acceptance criteria:**

- `pnpm dev` runs a blank Vite+React+TS app.
- Tailwind classes and at least one shadcn component (e.g. `Button`) render correctly.
- `pnpm test` runs Vitest successfully with zero tests (empty pass).

**Spec refs:** §7

### T2 — Fetching layer & time-window logic ✅

**Description:** Implement `src/api/hn.ts`: `RANGE_SECONDS` mapping (§3), `fetchStories(range, page)` against Algolia `search_by_date` (client-side sort by `points` desc per §2.1), `fetchItemWithComments(id)` against Algolia `items/{id}`. Wrap both in `useStories`/`useItem` React Query hooks with sane retry/staleness defaults (§8 rate-limit note).

**Acceptance criteria:**

- `fetchStories('all', 0)` omits the `numericFilters` lower bound; every other range sets `created_at_i>{lowerBound}` correctly per the §3 table.
- Returned hits are sorted by `points` descending.
- `useStories`/`useItem` expose loading/error/data state and are keyed on `[range, page]` / `[id]`.

**Spec refs:** §2.1, §3, §6

### T3 — URL state & `<SortControls />` ✅

**Description:** Wire `range`/`page` search params via `useSearchParams` as the single source of truth (no separate store). Build `<SortControls />` (Day/Week/Month/Year/All) that updates `range` and resets `page` to 0 on click.

**Acceptance criteria:**

- Loading `/?range=week&page=2` renders with that state pre-selected, no flash of default state.
- Clicking a different range updates the URL and resets `page` to `0`.
- Default route (`/`) behaves as `range=day&page=0`.

**Spec refs:** §4, §5.2

### T4 — `<StoryList />`, `<StoryCard />` & pagination ✅

**Description:** `<StoryList />` reads `range`/`page` from the URL, calls `useStories`, renders loading skeleton / error state / list of `<StoryCard />`. `<StoryCard />` shows rank, title (external link if `url` present, else `/item/:id`), domain (parsed from URL host), points, author, relative age, comment count linking to `/item/:id`. `<Pagination />` (Prev/Next) updates the `page` param.

**Acceptance criteria:**

- Self-posts / Ask HN (no `url`) link the title to `/item/:id` instead of externally.
- Domain is derived from `url` host, not shown for self-posts.
- Empty result set shows an empty state suggesting a wider range (§8).
- Prev/Next correctly clamp at first/last page (`nbPages`).

**Spec refs:** §5.2, §8

### T5 — `<StoryDetail />` (story header) ✅

**Description:** Route `/item/:id`, fetch full item via `useItem`, render the story header with the same fields as `<StoryCard />` plus full text for Ask HN/Show HN posts.

**Acceptance criteria:**

- Deleted/dead stories render a "[deleted]" placeholder instead of blank/crashing.
- Ask HN/Show HN post text is rendered (sanitized, see T6) when present.

**Spec refs:** §5.3, §8

### T6 — `<CommentThread />` (recursive) ✅

**Description:** Recursive component rendering a comment's author, age, and HTML-decoded/sanitized text (via `dompurify`) with `dangerouslySetInnerHTML`. Renders children recursively with indentation, capped visually past depth 6 (but still nested logically). Per-comment collapse/expand as local component state (not URL state).

**Acceptance criteria:**

- Comment HTML is passed through `dompurify` before rendering; a `<script>` payload in comment text does not execute.
- Deleted/dead comments render "[deleted]" instead of blank space.
- Visual indentation stops increasing past depth 6; deeper comments still nest under their correct parent.
- Collapsing a comment hides its descendants without affecting URL/router state.

**Spec refs:** §5.3, §8

### T7 — Error, empty & edge-case states

**Description:** Sweep the app for the §8 cases not already covered by earlier tickets: React Query retry/backoff defaults for Algolia rate limits, consistent empty-state UI for the story list, consistent "[deleted]" handling shared between `<StoryCard />`/`<StoryDetail />`/`<CommentThread />` rather than duplicated per component.

**Acceptance criteria:**

- A single shared helper/component renders "[deleted]"/"[dead]" placeholders, used by all three surfaces.
- React Query is configured with retry/backoff (not the bare default of 3 immediate retries) for both `useStories` and `useItem`.

**Spec refs:** §8

### T8 — Tests

**Description:** Vitest unit tests for the pure logic in `src/api/hn.ts` (range→timestamp math, points-descending sort). React Testing Library smoke test per route (`/` renders a story list container without crashing; `/item/:id` renders a story header without crashing, given a mocked fetch).

**Acceptance criteria:**

- `RANGE_SECONDS`/lower-bound calculation is covered for all five ranges including `all` (no lower bound).
- Sort-by-points is covered with an unsorted fixture.
- Both route smoke tests pass against a mocked `fetch`.

**Spec refs:** §2.1, §3

### T9 — Netlify deployment

**Description:** Deploy the built app to Netlify as a static site on the default `*.netlify.app` subdomain — no custom domain, no router basename. Add `netlify.toml` with the build config (`command`, `publish = "dist"`), a functions directory declaration (for T10's Netlify Function), and a catch-all SPA redirect (`/* /index.html 200`) so direct navigation/refresh on `/item/:id` doesn't 404. Connect the repo via Netlify's native git integration so every push to `main` auto-deploys; no GitHub Actions workflow needed.

**Acceptance criteria:**

- Pushing to `main` triggers a Netlify deploy automatically, no manual step and no GitHub Actions workflow file.
- Visiting `/item/123` directly (not via client-side nav) loads the app and resolves to that route via the `netlify.toml` redirect, not a 404.
- Internal links use router navigation, not full-page reloads.
- No basename/base path configured; the app is served from the site root.

**Spec refs:** §7, §9

### T10 — Netlify Functions & Blobs scaffold

**Description:** Set up the serverless plumbing for the recap feature: a Netlify Function at `netlify/functions/recap.ts`, wired into `netlify.toml`, and a thin wrapper around `@netlify/blobs` for reading/writing the `recaps` store. No recap logic yet — just enough to read/write a test key and return JSON, proving the deploy pipeline works end to end.

**Acceptance criteria:**

- `netlify dev` runs the function locally and it responds to `GET /.netlify/functions/recap`.
- The function can write a value to the `recaps` Blobs store and read it back.
- `@netlify/blobs` and Netlify's function types are added as dependencies.

**Spec refs:** §9.2, §9.3

### T11 — Recap generation logic

**Description:** Implement the full `recap` function per §9: compute the UTC date key, check the Blobs cache, on a miss fetch the top 10 day-range stories (reuse the Algolia query/sort logic from `src/api/hn.ts`), build the prompt, call OpenRouter (`inclusionai/ling-3.0-flash-sante:free` primary, `nvidia/nemotron-3-super-120b-a12b:free` fallback on error), parse the response into the §9.3 JSON shape, write it to Blobs, and return it. On total failure, return a "no recap" response without caching anything.

**Acceptance criteria:**

- A cache hit returns the stored blob without calling OpenRouter.
- A cache miss calls OpenRouter, stores the result keyed by UTC date, and returns it.
- A fewer-than-10-stories day still produces a recap using however many stories exist; a zero-story day returns "no recap" without calling the LLM.
- Primary model failure triggers exactly one fallback-model retry before giving up.
- `OPENROUTER_API_KEY` is read from a Netlify environment variable, never hardcoded.

**Spec refs:** §9.2, §9.4, §8

### T12 — `<DailyRecap />` component

**Description:** Add `<DailyRecap />` to the home page, rendered after `<SortControls />` and visible only when `range === 'day'`. Fetches from the recap function via a `useRecap` hook, shows a loading skeleton while generation is in flight, renders the intro paragraph + per-story blurbs on success, and renders nothing on error or "no recap" (§9.5).

**Acceptance criteria:**

- Not rendered at all when `range` is `week`/`month`/`year`/`all`.
- Shows a skeleton while the request is in flight, without blocking `<StoryList />` from rendering.
- Renders nothing (no error UI) if the function returns an error or a "no recap" response.
- Each story blurb links to the same target `<StoryCard />` would use (external URL if present, else `/item/:id`).

**Spec refs:** §9.5

### T13 — Recap tests

**Description:** Vitest unit tests for the pure logic behind the recap function: UTC date-key computation, the Blobs cache-hit/cache-miss branch, and the fallback-model retry logic, all with mocked `fetch`/Blobs calls (consistent with the T8 pattern).

**Acceptance criteria:**

- UTC date-key computation is covered across a day boundary (e.g. 23:59 vs 00:01 UTC).
- Cache-hit path is covered (mocked Blobs returns a value, OpenRouter is never called).
- Fallback-model retry is covered (primary call mocked to fail, fallback call mocked to succeed).

**Spec refs:** §9.2, §9.4

## 13. Tickets — v2 backlog

Deferred per §10/§11; not scheduled for v1. Kept in the same ticket format so they're ready to pick up without re-deriving from the spec.

### T14 — Keyword search

**Description:** Add a search box using the Algolia `search` endpoint's `query` param, reusing the existing fetching/pagination layer.

**Spec refs:** §10, §11

### T15 — "Hot" decayed-score sort

**Description:** Add a sort mode alongside pure point-sort using `score = points / (age_hours + 2)^gravity`.

**Spec refs:** §10, §11

### T16 — Infinite scroll

**Description:** Replace Prev/Next pagination with infinite scroll (append pages as the user scrolls).

**Spec refs:** §11

### T17 — Persist last-used range in localStorage

**Description:** Default the landing state to the last-used sort/range from localStorage; explicit URL params still take precedence.

**Spec refs:** §11

### T18 — Custom date range picker

**Description:** Add a calendar control letting the user pick a specific day or a custom date range instead of the fixed Day/Week/Month/Year/All buckets. Selected date(s) drive the same `numericFilters` lower/upper bound logic as §3, exposed via new URL params (e.g. `from`/`to`) alongside `range`.

**Spec refs:** §3, §4, §11

### T19 — Hackier header graphic with dark/light theme support

**Description:** Replace the plain "HN Top" text header with a more hacker-styled graphic/logo (e.g. terminal/glitch aesthetic), rendered correctly in both dark and light themes.

**Spec refs:** §11

### T20 — Week/Month/Year/All recaps

**Description:** Extend the recap feature (§9) beyond Day: generate and cache an equivalent recap for Week/Month/Year/All, each on its own regeneration cadence (e.g. the week's recap regenerates once a week, the month's once a month, and so on), reusing the same Blobs-cache-then-generate flow and OpenRouter models as the daily recap.

**Spec refs:** §9, §10, §11
