import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";

export function Pagination({ page, nbPages }: { page: number; nbPages: number }) {
  const [searchParams, setSearchParams] = useSearchParams();

  function goTo(newPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  }

  return (
    <div className="flex items-center justify-between py-4">
      <Button
        type="button"
        variant="outline"
        disabled={page <= 0}
        onClick={() => goTo(page - 1)}
      >
        Prev
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page + 1} of {Math.max(nbPages, 1)}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={page >= nbPages - 1}
        onClick={() => goTo(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
