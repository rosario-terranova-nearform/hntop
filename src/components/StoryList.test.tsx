import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoryList } from "./StoryList";

function renderAt(path: string, pages: { hits: unknown[]; nbPages: number }[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetchMock = vi.fn((url: string) => {
    const page = Number(new URL(url).searchParams.get("page") ?? "0");
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ...pages[page], page }),
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <StoryList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return fetchMock;
}

function hit(id: string, points = 10, ageHours = 1) {
  return {
    objectID: id,
    title: `Story ${id}`,
    url: null,
    points,
    author: "op",
    created_at: "2024-01-01T00:00:00Z",
    created_at_i: Math.floor(Date.now() / 1000) - ageHours * 3600,
    num_comments: 5,
  };
}

describe("StoryList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an empty state suggesting a wider range", async () => {
    renderAt("/?range=day", [{ hits: [], nbPages: 0 }]);
    expect(await screen.findByText(/no stories found/i)).toBeInTheDocument();
  });

  it("does not show a load-more state when only one page exists", async () => {
    renderAt("/?range=day", [{ hits: [hit("1")], nbPages: 1 }]);
    expect(await screen.findByText("Story 1")).toBeInTheDocument();
    expect(screen.queryByText(/loading more/i)).not.toBeInTheDocument();
  });

  it("appends the next page's stories when the sentinel intersects", async () => {
    let intersectionCallback: (entries: { isIntersecting: boolean }[]) => void =
      () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof intersectionCallback) {
          intersectionCallback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    const fetchMock = renderAt("/?range=day", [
      { hits: [hit("1")], nbPages: 2 },
      { hits: [hit("2")], nbPages: 2 },
    ]);
    await screen.findByText("Story 1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    intersectionCallback([{ isIntersecting: true }]);

    expect(await screen.findByText("Story 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sorts by hot score when sort=hot is set", async () => {
    renderAt("/?range=day&sort=hot", [
      { hits: [hit("old-high", 100, 48), hit("new-low", 20, 1)], nbPages: 1 },
    ]);
    const titles = (await screen.findAllByText(/^Story /)).map(
      (el) => el.textContent,
    );
    expect(titles).toEqual(["Story new-low", "Story old-high"]);
  });
});
