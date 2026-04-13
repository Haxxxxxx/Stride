/** Local YYYY-MM-DD string (avoids UTC off-by-one at timezone boundaries) */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Safely parse a timestamp that could be a Firestore Timestamp, ISO string, or number */
export function parseTimestamp(value: unknown): number {
  if (!value) return Date.now();
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  const ms = new Date(value as string).getTime();
  return isNaN(ms) ? Date.now() : ms;
}

/** Local ISO timestamp (YYYY-MM-DDTHH:mm:ss) — avoids UTC off-by-one at timezone boundaries */
export function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Today's day index (0=Mon, 6=Sun) — shared formula used by Dashboard, AIAgent, behaviorStore */
export function getTodayDayIndex(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 6 : dow - 1;
}

/** Current program week number (1-based, capped at total weeks) */
export function getCurrentProgramWeek(createdAt: unknown, totalWeeks: number): number {
  const createdMs = parseTimestamp(createdAt);
  const weeksSinceStart = Math.floor((Date.now() - createdMs) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(weeksSinceStart, Math.max(totalWeeks, 1));
}

/** Check if a program's cycle has fully elapsed (all weeks completed by calendar time) */
export function isProgramExpired(createdAt: unknown, totalWeeks: number): boolean {
  const createdMs = parseTimestamp(createdAt);
  const weeksSinceStart = Math.floor((Date.now() - createdMs) / (7 * 24 * 60 * 60 * 1000));
  return weeksSinceStart >= totalWeeks;
}

/** Get Monday 00:00 of the week containing the given date */
export function getMondayOf(d: Date): Date {
  const result = new Date(d);
  const dayOfWeek = result.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  result.setDate(result.getDate() - mondayOffset);
  result.setHours(0, 0, 0, 0);
  return result;
}
