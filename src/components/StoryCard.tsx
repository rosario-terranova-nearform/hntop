import { Link } from "react-router";
import type { HNHit } from "@/api/hn";
import { domainFromUrl, relativeAge } from "@/lib/utils";

export function StoryCard({ hit, rank }: { hit: HNHit; rank: number }) {
  const domain = domainFromUrl(hit.url);
  const itemHref = `/item/${hit.objectID}`;

  return (
    <div className="flex gap-3 border-b border-border py-3">
      <span className="w-6 shrink-0 text-right text-muted-foreground">
        {rank}.
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {hit.url ? (
            <a
              href={hit.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline"
            >
              {hit.title}
            </a>
          ) : (
            <Link to={itemHref} className="font-medium hover:underline">
              {hit.title}
            </Link>
          )}
          {domain && (
            <span className="text-xs text-muted-foreground">{domain}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {hit.points} points by {hit.author} · {relativeAge(hit.created_at_i)}{" "}
          ·{" "}
          <Link to={itemHref} className="hover:underline">
            {hit.num_comments} comments
          </Link>
        </div>
      </div>
    </div>
  );
}
