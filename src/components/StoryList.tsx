import { useSearchParams } from "react-router";
import { useStories, type Range } from "@/api/hn";
import { StoryCard } from "@/components/StoryCard";
import { Pagination } from "@/components/Pagination";

export function StoryList() {
  const [searchParams] = useSearchParams();
  const range = (searchParams.get("range") ?? "day") as Range;
  const page = Number(searchParams.get("page") ?? "0");

  const { data, isPending, isError } = useStories(range, page);

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

  if (data.hits.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No stories found for this range. Try a wider time window.
      </div>
    );
  }

  return (
    <div>
      {data.hits.map((hit, i) => (
        <StoryCard key={hit.objectID} hit={hit} rank={page * 30 + i + 1} />
      ))}
      <Pagination page={data.page} nbPages={data.nbPages} />
    </div>
  );
}
