import { useState } from "react";
import { useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (!next && searchParams.has("q")) {
      const params = new URLSearchParams(searchParams);
      params.delete("q");
      setSearchParams(params);
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="my-4 flex gap-2">
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search stories…"
        aria-label="Search stories"
        className="h-8 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
      />
      <Button type="submit" variant="outline" aria-label="Search">
        <Search />
      </Button>
    </form>
  );
}
