import { differenceInCalendarDays, parseISO, isValid } from "date-fns";

export function daysLeft(deadline: string): number {
  const d = parseISO(deadline);
  if (!isValid(d)) return 0;
  return differenceInCalendarDays(d, new Date());
}

export function isOverdue(deadline: string, status: string): boolean {
  if (status === "DONE") return false;
  return daysLeft(deadline) < 0;
}

export function safeDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
