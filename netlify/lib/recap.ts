import type { HNHit, Range } from "../../src/api/hn.js";

export interface RecapContent {
  summary: string;
  model: string;
}

export interface Recap extends RecapContent {
  date: string;
  range: Range;
}

const PRIMARY_MODEL = "inclusionai/ling-3.0-flash-sante:free";
const FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const RANGE_LABEL: Record<Range, string> = {
  day: "today",
  week: "this week",
  month: "this month",
  year: "this year",
  all: "of all time",
};

export function utcDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function buildPrompt(stories: HNHit[], range: Range): string {
  const list = stories
    .map(
      (s, i) =>
        `${i + 1}. "${s.title}" (${s.points} points, by ${s.author ?? "unknown"})`,
    )
    .join("\n");
  return (
    `Here are the top Hacker News stories ${RANGE_LABEL[range]}:\n${list}\n\n` +
    `Write a short paragraph (3-5 sentences) summarizing the overall themes and highlights across these stories. ` +
    `Respond with ONLY the paragraph text, no preamble, no markdown, no JSON.`
  );
}

async function callModel(model: string, prompt: string): Promise<string | null> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

export async function generateRecap(
  stories: HNHit[],
  range: Range,
): Promise<RecapContent | null> {
  if (stories.length === 0) return null;

  const prompt = buildPrompt(stories, range);
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    const summary = await callModel(model, prompt);
    if (summary) return { summary, model };
  }
  return null;
}
