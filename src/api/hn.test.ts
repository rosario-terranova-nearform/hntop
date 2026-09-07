import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RANGE_SECONDS, fetchStories } from "./hn";

describe("RANGE_SECONDS", () => {
  it("covers day/week/month/year", () => {
    expect(RANGE_SECONDS.day).toBe(24 * 60 * 60);
    expect(RANGE_SECONDS.week).toBe(7 * 24 * 60 * 60);
    expect(RANGE_SECONDS.month).toBe(30 * 24 * 60 * 60);
    expect(RANGE_SECONDS.year).toBe(365 * 24 * 60 * 60);
  });
});

describe("fetchStories", () => {
  const hits = [
    { objectID: "1", points: 10 },
    { objectID: "2", points: 50 },
    { objectID: "3", points: 30 },
  ];

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hits, nbPages: 5, page: 0 }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits numericFilters for 'all'", async () => {
    await fetchStories("all", 0);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("numericFilters");
  });

  it("sets created_at_i lower bound for other ranges", async () => {
    await fetchStories("week", 0);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toMatch(/numericFilters=created_at_i%3E\d+/);
  });

  it("uses the popularity-sorted search endpoint", async () => {
    await fetchStories("day", 0);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("/search?");
    expect(url).not.toContain("search_by_date");
  });

  it("returns hits as given by Algolia", async () => {
    const result = await fetchStories("day", 0);
    expect(result.hits.map((h) => h.points)).toEqual([10, 50, 30]);
  });
});
