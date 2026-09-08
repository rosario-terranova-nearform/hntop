# HN Top — Spec

A React app for browsing Hacker News stories with Reddit-style time-window sorting (Day / Week / Month / Year / All), plus a comment thread view.

## 1. Goals

- Let users sort HN stories by points within a chosen time window, similar to Reddit's "Top" sort.
- Support viewing a story's full comment thread inside the app (no need to leave for HN itself).
- Keep the app simple, fast, and stateless on the backend — no backend required, all data comes from public APIs.

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

## 5. Routes & components

### 5.1 Routes

- `/` — story list (home)
- `/item/:id` — story detail with comment thread

### 5.2 Story list (`/`)

**`<SortControls />`**

- Segmented control / button group: Day, Week, Month, Year, All
- Updates `range` search param on click (resets `page` to 0)

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

Centralize API calls in a small module, e.g. `src/api/hn.ts`:

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

## 7. Tech stack

- **React** (Vite scaffold)
- **React Router** — routes + URL-driven filter state
- **TanStack Query (React Query)** — data fetching, caching, loading/error states
- **dompurify** — sanitize comment HTML before render
- Styling: plain CSS or Tailwind (either works; no strong dependency either way)
- No backend, no database, no auth — fully static/client-side app, deployable to any static host (Vercel, Netlify, GitHub Pages)

## 8. Error handling & edge cases

- Algolia rate limits: no API key required for reasonable use, but add basic retry/backoff via React Query defaults.
- Empty result set (e.g., "Day" window with few qualifying stories): show an empty state, suggest widening the range.
- Deleted/dead stories or comments: Algolia items may have `null` text or a `deleted`/`dead` flag — render a "[deleted]" placeholder instead of blank space.
- Malformed URLs in stories (self-posts / Ask HN have no `url`): link to `/item/:id` instead of external link.
- Comment tree depth: very deep threads should not break layout — cap visual indentation (e.g., stop increasing indent past depth 6, but keep nesting logically).

## 9. Out of scope (v1)

- User accounts, voting, submitting stories/comments (HN API is read-only anyway; no write access exists).
- "Hot"/decayed-score sorting (possible v2 enhancement, see below).
- Search by keyword (could reuse the same Algolia endpoint later with a `query` param).

## 10. Possible v2 enhancements

- Add a keyword search box (Algolia `search` endpoint already supports `query`).
- Add a decayed "hot" score option alongside pure point-sort, using an HN/Reddit-style formula: `score = points / (age_hours + 2)^gravity`.
- Infinite scroll instead of pagination buttons.
- Persist last-used sort/range in localStorage as the default landing state (URL param still takes precedence if present).

## 11. Tickets — v1

Stack decisions locked in for these tickets: TypeScript, Tailwind v4 + shadcn/ui, pnpm, React Router v7, TanStack Query, Vitest + React Testing Library, GitHub Pages deployment (repo `hntop`, served at `/hntop/`).

After implementing a ticket, apply a check ✅ in the relative title.

### T1 — Project scaffold ✅

**Description:** Bootstrap the app: Vite + React + TypeScript template, pnpm as package manager, Tailwind v4 + shadcn/ui initialized (base color, CSS variables), React Router v7 and TanStack Query installed, Vitest + React Testing Library configured. Set `vite.config.ts` `base: '/hntop/'` up front so later tickets don't need to touch it.

**Acceptance criteria:**

- `pnpm dev` runs a blank Vite+React+TS app.
- Tailwind classes and at least one shadcn component (e.g. `Button`) render correctly.
- `pnpm test` runs Vitest successfully with zero tests (empty pass).
- `vite.config.ts` has `base: '/hntop/'`.

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

### T6 — `<CommentThread />` (recursive)

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

### T9 — GitHub Pages deployment

**Description:** Deploy the built app to GitHub Pages as a project site at `/hntop/`. Use `BrowserRouter` with `basename="/hntop"` (not `HashRouter`) to keep the clean URLs from §4. Add a GitHub Actions workflow that builds and publishes on push to `main`. Add a `404.html` (copy of `index.html` with the standard `spa-github-pages` redirect script) so direct navigation/refresh on `/item/:id` doesn't 404.

**Acceptance criteria:**

- Pushing to `main` triggers a workflow that builds and publishes to GitHub Pages with no manual step.
- Visiting `https://<user>.github.io/hntop/item/123` directly (not via client-side nav) loads the app and resolves to that route, not a 404.
- Internal links use router navigation, not full-page reloads.

**Spec refs:** §7

## 12. Tickets — v2 backlog

Deferred per §9/§10; not scheduled for v1. Kept in the same ticket format so they're ready to pick up without re-deriving from the spec.

### T10 — Keyword search

**Description:** Add a search box using the Algolia `search` endpoint's `query` param, reusing the existing fetching/pagination layer.

**Spec refs:** §9, §10

### T11 — "Hot" decayed-score sort

**Description:** Add a sort mode alongside pure point-sort using `score = points / (age_hours + 2)^gravity`.

**Spec refs:** §9, §10

### T12 — Infinite scroll

**Description:** Replace Prev/Next pagination with infinite scroll (append pages as the user scrolls).

**Spec refs:** §10

### T13 — Persist last-used range in localStorage

**Description:** Default the landing state to the last-used sort/range from localStorage; explicit URL params still take precedence.

**Spec refs:** §10

### T14 — Custom date range picker

**Description:** Add a calendar control letting the user pick a specific day or a custom date range instead of the fixed Day/Week/Month/Year/All buckets. Selected date(s) drive the same `numericFilters` lower/upper bound logic as §3, exposed via new URL params (e.g. `from`/`to`) alongside `range`.

**Spec refs:** §3, §4, §10

### T15 — Hackier header graphic with dark/light theme support

**Description:** Replace the plain "HN Top" text header with a more hacker-styled graphic/logo (e.g. terminal/glitch aesthetic), rendered correctly in both dark and light themes.

**Spec refs:** §10
