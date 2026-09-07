import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoryList } from "./StoryList";

function renderAt(path: string, hits: unknown[], nbPages = 1) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hits, nbPages, page: 0 }),
    }),
  );
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <StoryList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const hit = {
  objectID: "1",
  title: "A story",
  url: null,
  points: 10,
  author: "op",
  created_at: "2024-01-01T00:00:00Z",
  created_at_i: Math.floor(Date.now() / 1000) - 3600,
  num_comments: 5,
};

describe("StoryList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an empty state suggesting a wider range", async () => {
    renderAt("/?range=day&page=0", []);
    expect(await screen.findByText(/no stories found/i)).toBeInTheDocument();
  });

  it("clamps Prev/Next at the first/last page", async () => {
    renderAt("/?range=day&page=0", [hit], 1);
    expect(await screen.findByRole("link", { name: "A story" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
