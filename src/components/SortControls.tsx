import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import type { Range } from "@/api/hn";

const RANGES: { value: Range; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

export function SortControls() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") ?? "day";

  return (
    <div role="group" aria-label="Sort by time range" className="flex gap-1">
      {RANGES.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant={value === range ? "default" : "outline"}
          aria-pressed={value === range}
          onClick={() => setSearchParams({ range: value, page: "0" })}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
