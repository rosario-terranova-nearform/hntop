import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { SearchBox } from "./SearchBox";
import { renderAt } from "@/test/renderAt";

describe("SearchBox", () => {
  it("pre-fills from the URL's q param", () => {
    renderAt("/?q=rust", <SearchBox />);
    expect(screen.getByRole("searchbox")).toHaveValue("rust");
  });

  it("sets q on submit", () => {
    renderAt("/?range=week", <SearchBox />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "rust" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByTestId("location").textContent).toBe(
      "?range=week&q=rust",
    );
  });

  it("removes q on submit with an empty search term", () => {
    renderAt("/?range=week&q=rust", <SearchBox />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByTestId("location").textContent).toBe("?range=week");
  });
});
