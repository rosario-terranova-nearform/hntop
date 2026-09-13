import { getRecap, setRecap } from "../lib/recapStore.js";
import { generateRecap, utcDateKey, type Recap } from "../lib/recap.js";
import { fetchStories, RANGE_SECONDS, type Range } from "../../src/api/hn.js";

const VALID_RANGES = new Set<string>([...Object.keys(RANGE_SECONDS), "all"]);

function parseRange(url: string): Range {
  const value = new URL(url).searchParams.get("range");
  return (VALID_RANGES.has(value ?? "") ? value : "day") as Range;
}

export default async (req: Request) => {
  const range = parseRange(req.url);
  const date = utcDateKey();
  const key = `${range}:${date}`;

  const cached = await getRecap(key);
  if (cached) return Response.json(cached);

  const { hits } = await fetchStories(range, 0);
  const content = await generateRecap(hits.slice(0, 10), range);
  if (!content) return Response.json(null);

  const recap: Recap = { date, range, ...content };
  await setRecap(key, recap);
  return Response.json(recap);
};
