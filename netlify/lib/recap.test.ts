import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { utcDateKey, periodKey, generateRecap } from "./recap.js";
import type { HNHit } from "../../src/api/hn.js";

describe("utcDateKey", () => {
  it("returns the UTC date across a day boundary", () => {
    expect(utcDateKey(new Date("2026-09-13T23:59:00Z"))).toBe("2026-09-13");
    expect(utcDateKey(new Date("2026-09-14T00:01:00Z"))).toBe("2026-09-14");
  });
});

describe("periodKey", () => {
  const d = new Date("2026-09-14T12:00:00Z"); // a Monday

  it("stays stable within each range's granularity", () => {
    expect(periodKey("day", d)).toBe("2026-09-14");
    expect(periodKey("week", d)).toBe("2026-W38");
    expect(periodKey("month", d)).toBe("2026-09");
    expect(periodKey("year", d)).toBe("2026");
    expect(periodKey("all", d)).toBe("all");
  });

  it("advances week and month keys only when the calendar period changes", () => {
    const sameWeekLaterInDay = new Date("2026-09-15T00:00:01Z");
    expect(periodKey("week", sameWeekLaterInDay)).toBe(periodKey("week", d));

    const nextMonth = new Date("2026-10-01T00:00:00Z");
    expect(periodKey("month", nextMonth)).not.toBe(periodKey("month", d));
  });

  it("never changes for 'all', regardless of date", () => {
    expect(periodKey("all", new Date("2020-01-01T00:00:00Z"))).toBe(
      periodKey("all", new Date("2030-01-01T00:00:00Z")),
    );
  });
});

describe("generateRecap", () => {
  const stories: HNHit[] = [
    {
      objectID: "1",
      title: "Story one",
      url: "https://a.com",
      points: 100,
      author: "a",
      created_at: "",
      created_at_i: 0,
      num_comments: 0,
    },
  ];

  const okResponse = (content: string) => ({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content } }] }),
  });

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null without calling the model when there are no stories", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const result = await generateRecap([], "day");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to the secondary model exactly once when the primary fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce(okResponse("A quiet day of niche tooling and AI takes."));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateRecap(stories, "day");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result?.model).toBe("nvidia/nemotron-3-super-120b-a12b:free");
    expect(result?.summary).toBe("A quiet day of niche tooling and AI takes.");
  });

  it("returns null when both models fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }),
    );
    const result = await generateRecap(stories, "week");
    expect(result).toBeNull();
  });
});
