import { describe, expect, it, vi, beforeEach } from "vitest";

const { getRecap, setRecap } = vi.hoisted(() => ({
  getRecap: vi.fn(),
  setRecap: vi.fn(),
}));
vi.mock("../lib/recapStore.js", () => ({ getRecap, setRecap }));

const { generateRecap, utcDateKey } = vi.hoisted(() => ({
  generateRecap: vi.fn(),
  utcDateKey: vi.fn(() => "2026-09-13"),
}));
vi.mock("../lib/recap.js", () => ({ generateRecap, utcDateKey }));

const { fetchStories } = vi.hoisted(() => ({ fetchStories: vi.fn() }));
vi.mock("../../src/api/hn.js", () => ({
  fetchStories,
  RANGE_SECONDS: { day: 1, week: 1, month: 1, year: 1 },
}));

import handler from "./recap.js";

function request(range?: string) {
  const url = range
    ? `http://localhost/.netlify/functions/recap?range=${range}`
    : "http://localhost/.netlify/functions/recap";
  return new Request(url);
}

describe("recap function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    utcDateKey.mockReturnValue("2026-09-13");
  });

  it("returns the cached recap on a hit, without calling OpenRouter", async () => {
    const cached = { date: "2026-09-13", range: "day", summary: "cached", model: "m" };
    getRecap.mockResolvedValue(cached);

    const res = await handler(request("day"));

    expect(await res.json()).toEqual(cached);
    expect(getRecap).toHaveBeenCalledWith("day:2026-09-13");
    expect(fetchStories).not.toHaveBeenCalled();
    expect(generateRecap).not.toHaveBeenCalled();
    expect(setRecap).not.toHaveBeenCalled();
  });

  it("generates and caches a fresh recap on a miss, keyed by range and date", async () => {
    getRecap.mockResolvedValue(null);
    fetchStories.mockResolvedValue({
      hits: [{ objectID: "1" }],
      nbPages: 1,
      page: 0,
    });
    const content = { summary: "fresh", model: "m" };
    generateRecap.mockResolvedValue(content);

    const res = await handler(request("week"));

    expect(fetchStories).toHaveBeenCalledWith("week", 0);
    expect(await res.json()).toEqual({ date: "2026-09-13", range: "week", ...content });
    expect(setRecap).toHaveBeenCalledWith("week:2026-09-13", {
      date: "2026-09-13",
      range: "week",
      ...content,
    });
  });

  it("defaults to 'day' for a missing or invalid range", async () => {
    getRecap.mockResolvedValue(null);
    fetchStories.mockResolvedValue({ hits: [], nbPages: 0, page: 0 });
    generateRecap.mockResolvedValue(null);

    await handler(request("bogus"));

    expect(fetchStories).toHaveBeenCalledWith("day", 0);
  });

  it("returns null and caches nothing when generation fails", async () => {
    getRecap.mockResolvedValue(null);
    fetchStories.mockResolvedValue({ hits: [], nbPages: 0, page: 0 });
    generateRecap.mockResolvedValue(null);

    const res = await handler(request("day"));

    expect(await res.json()).toBeNull();
    expect(setRecap).not.toHaveBeenCalled();
  });
});
