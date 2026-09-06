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
    renderAt("/?range=week&page=2");
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("updates range and resets page to 0 on click", () => {
    renderAt("/?range=week&page=2");
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByTestId("location").textContent).toBe(
      "?range=month&page=0",
    );
  });
});
