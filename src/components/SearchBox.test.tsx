import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { SearchBox } from "./SearchBox";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SearchBox />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("SearchBox", () => {
  it("pre-fills from the URL's q param", () => {
    renderAt("/?q=rust");
    expect(screen.getByRole("searchbox")).toHaveValue("rust");
  });

  it("sets q and resets page to 0 on submit", () => {
    renderAt("/?range=week&page=2");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "rust" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByTestId("location").textContent).toBe(
      "?range=week&page=0&q=rust",
    );
  });

  it("removes q on submit with an empty search term", () => {
    renderAt("/?range=week&page=2&q=rust");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByTestId("location").textContent).toBe(
      "?range=week&page=0",
    );
  });
});
