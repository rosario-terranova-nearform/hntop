import { useSearchParams } from "react-router";
import { dateStringToUnix, type DateBounds, type Range } from "@/api/hn";
import { getStoredRange } from "@/lib/preferences";

/**
 * Derived view of the list-filter URL params (range, q, from/to).
 * Single source of truth shared by StoryList, SortControls and DateRangePicker.
 */
export function useListParams() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const isCustomRange = Boolean(fromParam || toParam);

  const dateBounds: DateBounds | undefined = isCustomRange
    ? {
        from: fromParam ? dateStringToUnix(fromParam) : undefined,
        to: toParam ? dateStringToUnix(toParam, true) : undefined,
      }
    : undefined;

  return {
    range: (searchParams.get("range") ?? getStoredRange()) as Range,
    query: searchParams.get("q") ?? "",
    from: fromParam ?? "",
    to: toParam ?? "",
    isCustomRange,
    dateBounds,
  };
}
