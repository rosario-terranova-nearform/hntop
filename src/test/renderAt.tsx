import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

// Renders `ui` at a given route, exposing the current query string for assertions.
export function renderAt(path: string, ui: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {ui}
      <LocationDisplay />
    </MemoryRouter>,
  );
}
