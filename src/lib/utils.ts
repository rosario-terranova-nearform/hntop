
const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
]

export function relativeAge(createdAtI: number): string {
  const diffSeconds = createdAtI - Math.floor(Date.now() / 1000)
  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return RTF.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return RTF.format(diffSeconds, "second")
}

export function domainFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

// Active-state styling shared by the SortControls sort toggle and DateRangePicker trigger.
export const ACTIVE_FILTER_CLASSES =
  "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300"

// Shared "[deleted]"/"[dead]" placeholder for StoryCard/StoryDetail/CommentThread (§8).
export function deletedLabel(entity: {
  author: string | null
  title?: string | null
  text?: string | null
  dead?: boolean
}): string | null {
  if (entity.dead) return "[dead]"
  if (!entity.author && !entity.title && !entity.text) return "[deleted]"
  return null
}
