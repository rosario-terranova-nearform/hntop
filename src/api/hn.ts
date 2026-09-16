import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export type Range = "day" | "week" | "month" | "year" | "all";
export type Sort = "top" | "hot";

export const RANGE_SECONDS: Record<Exclude<Range, "all">, number> = {
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  year: 365 * 24 * 60 * 60,
};

export interface HNHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number;
  author: string | null;
  created_at: string;
  created_at_i: number;
  num_comments: number;
  dead?: boolean;
}

export interface StoryListResult {
  hits: HNHit[];
  nbPages: number;
  page: number;
}

export interface HNItem {
  id: number;
  title: string | null;
  url: string | null;
  points: number | null;
  author: string | null;
  created_at: string;
  created_at_i: number;
  text: string | null;
  children: HNItem[];
  dead?: boolean;
}

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";

export interface DateBounds {
  from?: number;
  to?: number;
}

// Native <input type="date"> gives "YYYY-MM-DD"; anchor to UTC start/end of that day.
export function dateStringToUnix(dateStr: string, endOfDay = false): number {
  return Math.floor(
    new Date(`${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).getTime() / 1000,
  );
}

export async function fetchStories(
  range: Range,
  page: number,
  query = "",
  dateBounds?: DateBounds,
): Promise<StoryListResult> {
  const params = new URLSearchParams({
    tags: "story",
    page: String(page),
    hitsPerPage: "30",
  });
  if (dateBounds?.from != null || dateBounds?.to != null) {
    const filters: string[] = [];
    if (dateBounds.from != null) filters.push(`created_at_i>${dateBounds.from}`);
    if (dateBounds.to != null) filters.push(`created_at_i<${dateBounds.to}`);
    params.set("numericFilters", filters.join(","));
  } else if (range !== "all") {
    const lowerBound = Math.floor(Date.now() / 1000) - RANGE_SECONDS[range];
    params.set("numericFilters", `created_at_i>${lowerBound}`);
  }
  if (query) params.set("query", query);
  const res = await fetch(`${ALGOLIA_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`Algolia search failed: ${res.status}`);
  return (await res.json()) as StoryListResult;
}

// HN's own front-page decay constant (§11: score = points / (age_hours + 2)^gravity).
const HOT_GRAVITY = 1.8;

export function hotScore(points: number, createdAtI: number, now = Date.now()): number {
  const ageHours = (now / 1000 - createdAtI) / 3600;
  return points / Math.pow(ageHours + 2, HOT_GRAVITY);
}

export async function fetchItemWithComments(id: string): Promise<HNItem> {
  const res = await fetch(`${ALGOLIA_BASE}/items/${id}`);
  if (!res.ok) throw new Error(`Algolia item fetch failed: ${res.status}`);
  return (await res.json()) as HNItem;
}

// Backoff instead of React Query's default 3 immediate retries (§8: Algolia rate limits).
export const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000);

export function useInfiniteStories(range: Range, query = "", dateBounds?: DateBounds) {
  return useInfiniteQuery({
    queryKey: ["stories", range, query, dateBounds?.from, dateBounds?.to],
    queryFn: ({ pageParam }) => fetchStories(range, pageParam, query, dateBounds),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.nbPages ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
    retry: 2,
    retryDelay,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItemWithComments(id),
    staleTime: 60_000,
    retry: 2,
    retryDelay,
  });
}
