import { useParams } from "react-router";
import DOMPurify from "dompurify";
import { useItem, type HNItem } from "@/api/hn";
import { deletedLabel, domainFromUrl, relativeAge } from "@/lib/utils";
import { CommentThread } from "@/components/CommentThread";

function countComments(children: HNItem[]): number {
  return children.reduce((n, c) => n + 1 + countComments(c.children), 0);
}

export function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError } = useItem(id!);

  if (isPending) {
    return (
      <div className="py-8 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load story. Please try again.
      </div>
    );
  }

  const deleted = deletedLabel(data);

  if (!data.author && !data.title) {
    return (
      <div className="py-8 text-center text-muted-foreground">{deleted}</div>
    );
  }

  const domain = domainFromUrl(data.url);

  return (
    <div className="border-b border-border py-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        {data.url ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-lg font-medium hover:underline"
          >
            {data.title ?? deleted}
          </a>
        ) : (
          <span className="text-lg font-medium">{data.title ?? deleted}</span>
        )}
        {domain && (
          <span className="text-xs text-muted-foreground">{domain}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {data.points ?? 0} points by {data.author ?? deleted} ·{" "}
        {relativeAge(data.created_at_i)} · {countComments(data.children)}{" "}
        comments
      </div>
      {data.text && (
        <div
          className="mt-3 text-sm [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.text) }}
        />
      )}
      <div className="mt-2">
        {data.children.map((child) => (
          <CommentThread key={child.id} comment={child} />
        ))}
      </div>
    </div>
  );
}
