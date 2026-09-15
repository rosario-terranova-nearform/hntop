import type { Range, Sort } from "@/api/hn";

// Last-used range/sort, used as the landing default when the URL has no explicit param (§11 T17).
function getStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage disabled (e.g. private browsing) — landing default just falls back next time
  }
}

export const getStoredRange = () => getStored<Range>("hntop:range", "day");
export const setStoredRange = (range: Range) => setStored("hntop:range", range);
export const getStoredSort = () => getStored<Sort>("hntop:sort", "top");
export const setStoredSort = (sort: Sort) => setStored("hntop:sort", sort);
