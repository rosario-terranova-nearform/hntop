import { Link, useLocation } from "react-router";
import { ExternalLink, MessageSquare } from "lucide-react";
import type { HNHit } from "@/api/hn";
import { domainFromUrl, relativeAge } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function StoryCard({ hit, rank }: { hit: HNHit; rank: number }) {
  const location = useLocation();
  const domain = domainFromUrl(hit.url);
  const itemHref = `/item/${hit.objectID}`;
  const modalLinkState = { backgroundLocation: location };

  return (
    <div className="flex gap-3 border-b border-border py-3">
      <span className="w-6 shrink-0 text-right text-muted-foreground">
        {rank}.
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{hit.title}</span>
          {domain && (
            <span className="text-xs text-muted-foreground">{domain}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {hit.points} points by {hit.author} · {relativeAge(hit.created_at_i)}
        </div>
        <div className="mt-2 flex gap-2">
          {hit.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={hit.url} target="_blank" rel="noreferrer">
                <ExternalLink /> Open
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={itemHref} state={modalLinkState}>
              <MessageSquare /> {hit.num_comments} comments
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
