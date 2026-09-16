import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveTheme, applyTheme } from "./theme";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches }) as unknown as typeof matchMedia,
  );
}

describe("resolveTheme", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("follows the browser preference when nothing is stored", () => {
    stubMatchMedia(true);
    expect(resolveTheme()).toBe("dark");
    stubMatchMedia(false);
    expect(resolveTheme()).toBe("light");
  });

  it("prefers an explicit stored choice over the browser preference", () => {
    stubMatchMedia(true);
    localStorage.setItem("hntop:theme", "light");
    expect(resolveTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("toggles the .dark class on the root element", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
