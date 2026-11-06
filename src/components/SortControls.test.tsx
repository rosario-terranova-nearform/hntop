import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { SortControls } from "./SortControls";
import { renderAt } from "@/test/renderAt";

describe("SortControls", () => {
  it("defaults to day when no range is in the URL", () => {
    renderAt("/", <SortControls />);
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("pre-selects the range from the URL with no default flash", () => {
    renderAt("/?range=week", <SortControls />);
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
    renderAt("/?range=week", <SortControls />);
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByTestId("location").textContent).toBe("?range=month");
  });

  it("lands on the last-used range from localStorage when the URL has none", () => {
    localStorage.setItem("hntop:range", "year");
    renderAt("/", <SortControls />);
    expect(screen.getByRole("button", { name: "Year" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("prefers an explicit URL range over a stored one", () => {
    localStorage.setItem("hntop:range", "year");
    renderAt("/?range=day", <SortControls />);
    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("remembers range clicks for next time", () => {
    renderAt("/?range=week", <SortControls />);
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(localStorage.getItem("hntop:range")).toBe("month");
  });
});
