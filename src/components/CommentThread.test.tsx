import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentThread } from "./CommentThread";
import type { HNItem } from "@/api/hn";

function makeComment(overrides: Partial<HNItem> = {}): HNItem {
  return {
    id: 1,
    title: null,
    url: null,
    points: null,
    author: "op",
    created_at: "2024-01-01T00:00:00Z",
    created_at_i: Math.floor(Date.now() / 1000) - 3600,
    text: "hello",
    children: [],
    ...overrides,
  };
}

describe("CommentThread", () => {
  it("sanitizes comment HTML so a script payload does not execute", () => {
    const comment = makeComment({ text: '<img src=x onerror="window.__xss=1">safe' });
    render(<CommentThread comment={comment} />);
    expect(screen.getByText(/safe/)).toBeInTheDocument();
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("renders deleted comments as a placeholder", () => {
    const comment = makeComment({ author: null, text: null });
    render(<CommentThread comment={comment} />);
    expect(screen.getByText(/\[deleted\]/)).toBeInTheDocument();
  });

  it("collapsing a comment hides its descendants", () => {
    const child = makeComment({ id: 2, text: "child text" });
    const parent = makeComment({ id: 1, children: [child] });
    render(<CommentThread comment={parent} />);
    expect(screen.getByText("child text")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "[−]" })[0]);
    expect(screen.queryByText("child text")).not.toBeInTheDocument();
  });
});
