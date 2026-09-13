import { useRecap } from "@/api/recap";
import type { Range } from "@/api/hn";

export function Recap({ range }: { range: Range }) {
  const { data, isPending, isError } = useRecap(range);

  if (isPending) {
    return <div className="my-4 h-20 animate-pulse rounded-md bg-muted" />;
  }

  if (isError || !data) return null;

  return (
    <div className="my-4 rounded-md border border-border p-4 text-sm">
      {data.summary}
    </div>
  );
}
