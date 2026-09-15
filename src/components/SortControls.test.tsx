import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { SortControls } from "./SortControls";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SortControls />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("SortControls", () => {
  it("defaults to day when no range is in the URL", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("pre-selects the range from the URL with no default flash", () => {
    renderAt("/?range=week");
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("updates range on click", () => {
    renderAt("/?range=week");
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByTestId("location").textContent).toBe("?range=month");
  });

  it("defaults to top sort and toggles to hot without losing the range", () => {
    renderAt("/?range=week");
    expect(screen.getByRole("button", { name: "Top" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Hot" }));
    expect(screen.getByTestId("location").textContent).toBe(
      "?range=week&sort=hot",
    );
  });

  it("lands on the last-used range/sort from localStorage when the URL has none", () => {
    localStorage.setItem("hntop:range", "year");
    localStorage.setItem("hntop:sort", "hot");
    renderAt("/");
    expect(screen.getByRole("button", { name: "Year" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Hot" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("prefers an explicit URL range over a stored one", () => {
    localStorage.setItem("hntop:range", "year");
    renderAt("/?range=day");
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("remembers range and sort clicks for next time", () => {
    renderAt("/?range=week");
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    fireEvent.click(screen.getByRole("button", { name: "Hot" }));
    expect(localStorage.getItem("hntop:range")).toBe("month");
    expect(localStorage.getItem("hntop:sort")).toBe("hot");
  });
});
