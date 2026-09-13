import { useQuery } from "@tanstack/react-query";

export type Range = "day" | "week" | "month" | "year" | "all";

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

export async function fetchStories(
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
  const res = await fetch(`${ALGOLIA_BASE}/search?${params}`);
  if (!res.ok) throw new Error(`Algolia search failed: ${res.status}`);
  return (await res.json()) as StoryListResult;
}

export async function fetchItemWithComments(id: string): Promise<HNItem> {
  const res = await fetch(`${ALGOLIA_BASE}/items/${id}`);
  if (!res.ok) throw new Error(`Algolia item fetch failed: ${res.status}`);
  return (await res.json()) as HNItem;
}

// Backoff instead of React Query's default 3 immediate retries (§8: Algolia rate limits).
export const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000);

export function useStories(range: Range, page: number) {
  return useQuery({
    queryKey: ["stories", range, page],
    queryFn: () => fetchStories(range, page),
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
