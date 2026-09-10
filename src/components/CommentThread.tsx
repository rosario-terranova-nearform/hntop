import { useState } from "react";
import DOMPurify from "dompurify";
import type { HNItem } from "@/api/hn";
import { deletedLabel, relativeAge } from "@/lib/utils";

const MAX_INDENT_DEPTH = 6;

export function CommentThread({
  comment,
  depth = 0,
}: {
  comment: HNItem;
  depth?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const deleted = deletedLabel(comment);
  const indent = Math.min(depth, MAX_INDENT_DEPTH) * 16;

  return (
    <div
      style={{ marginLeft: indent }}
      className="border-l border-border py-2 pl-3"
    >
      <div className="text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="mr-1 cursor-pointer hover:underline"
        >
          [{collapsed ? "+" : "−"}]
        </button>
        {comment.author ?? deleted} · {relativeAge(comment.created_at_i)}
      </div>
      {!collapsed && (
        <>
          {!deleted && comment.text && (
            <div
              className="mt-1 text-sm [&_a]:underline"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(comment.text),
              }}
            />
          )}
          {comment.children.map((child) => (
            <CommentThread key={child.id} comment={child} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  );
}
