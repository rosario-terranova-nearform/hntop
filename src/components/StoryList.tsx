import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { dateStringToUnix, hotScore, useInfiniteStories, type Range, type Sort } from "@/api/hn";
import { StoryCard } from "@/components/StoryCard";
import { getStoredRange, getStoredSort } from "@/lib/preferences";

export function StoryList() {
  const [searchParams] = useSearchParams();
  const range = (searchParams.get("range") ?? getStoredRange()) as Range;
  const query = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") ?? getStoredSort()) as Sort;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const dateBounds = fromParam || toParam
    ? {
        from: fromParam ? dateStringToUnix(fromParam) : undefined,
        to: toParam ? dateStringToUnix(toParam, true) : undefined,
      }
    : undefined;

  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteStories(range, query, dateBounds);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load stories. Please try again.
      </div>
    );
  }

  const hits = data.pages.flatMap((p) => p.hits);

  if (hits.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No stories found for this range. Try a wider time window.
      </div>
    );
  }

  const sorted =
    sort === "hot"
      ? [...hits].sort(
          (a, b) =>
            hotScore(b.points, b.created_at_i) - hotScore(a.points, a.created_at_i),
        )
      : hits;

  return (
    <div>
      {sorted.map((hit, i) => (
        <StoryCard key={hit.objectID} hit={hit} rank={i + 1} />
      ))}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="py-4 text-center text-muted-foreground">
          Loading more…
        </div>
      )}
    </div>
  );
}
