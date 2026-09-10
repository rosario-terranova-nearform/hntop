import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoryDetail } from "./StoryDetail";

function renderAt(item: unknown) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(item),
    }),
  );
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/item/1"]}>
        <Routes>
          <Route path="/item/:id" element={<StoryDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const item = {
  id: 1,
  title: "A story",
  url: null,
  points: 10,
  author: "op",
  created_at: "2024-01-01T00:00:00Z",
  created_at_i: Math.floor(Date.now() / 1000) - 3600,
  text: null,
  children: [],
};

describe("StoryDetail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a story header without crashing", async () => {
    renderAt(item);
    expect(await screen.findByText("A story")).toBeInTheDocument();
    expect(screen.getByText(/points by op/)).toBeInTheDocument();
  });
});
