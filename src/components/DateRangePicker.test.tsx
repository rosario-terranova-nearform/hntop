import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { DateRangePicker } from "./DateRangePicker";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DateRangePicker />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("DateRangePicker", () => {
  it("shows a placeholder label with no range set", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: /custom range/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear date range" }),
    ).not.toBeInTheDocument();
  });

  it("labels the trigger from the from/to URL params", () => {
    renderAt("/?from=2026-09-01&to=2026-09-10");
    expect(screen.getByRole("button", { name: /Sep 1.*Sep 10/ })).toBeInTheDocument();
  });

  it("labels an open-ended lower bound", () => {
    renderAt("/?from=2026-09-01");
    expect(screen.getByRole("button", { name: /From Sep 1/ })).toBeInTheDocument();
  });

  it("clears both params on click", () => {
    renderAt("/?from=2026-09-01&to=2026-09-10&range=week");
    fireEvent.click(screen.getByRole("button", { name: "Clear date range" }));
    expect(screen.getByTestId("location").textContent).toBe("?range=week");
  });
});
