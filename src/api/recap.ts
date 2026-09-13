import { useQuery } from "@tanstack/react-query";
import { retryDelay, type Range } from "./hn";

export interface Recap {
  date: string;
  range: Range;
  summary: string;
  model: string;
}

export async function fetchRecap(range: Range): Promise<Recap | null> {
  const res = await fetch(`/.netlify/functions/recap?range=${range}`);
  if (!res.ok) return null;
  return res.json();
}

export function useRecap(range: Range) {
  return useQuery({
    queryKey: ["recap", range],
    queryFn: () => fetchRecap(range),
    staleTime: 60_000,
    retry: 2,
    retryDelay,
  });
}
