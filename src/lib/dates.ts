/** Date helpers for showing tasks by week-of-year and month. */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parse a YYYY-MM-DD string as a local date (no timezone surprises). */
export function parseDate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** ISO 8601 week number (1–53). */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000))
}

export function monthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()]
}

/** "Week 28 · Jul 8" */
export function formatDueLabel(s: string): string {
  const d = parseDate(s)
  if (!d) return ''
  return `Week ${isoWeek(d)} · ${monthShort(d)} ${d.getDate()}`
}

const startOfToday = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/** Negative = overdue, 0 = today, positive = days away, null = no/invalid date. */
export function daysUntil(s: string): number | null {
  const d = parseDate(s)
  if (!d) return null
  return Math.round((d.getTime() - startOfToday().getTime()) / 86400000)
}
