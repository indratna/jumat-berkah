const JAKARTA_TIME_ZONE = "Asia/Jakarta";
const FRIDAY_INDEX = 5;

export type FridayCycleRange = {
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
  label: string;
  deadlineAt: Date;
  deadlineAtIso: string;
  isNewCycle: boolean;
};

type FridayCycleRangeBase = Omit<FridayCycleRange, "isNewCycle">;

export function getCurrentFridayCycleRange(now = new Date()): FridayCycleRange {
  const cycle = getCurrentFridayCycleRangeBase(now);

  return {
    ...cycle,
    isNewCycle: isWithinNewCycleWindow(now),
  };
}

export function isWithinNewCycleWindow(now: Date): boolean {
  const cycle = getCurrentFridayCycleRangeBase(now);
  return now.getTime() - cycle.from.getTime() < 24 * 60 * 60 * 1000;
}

function getCurrentFridayCycleRangeBase(now: Date): FridayCycleRangeBase {
  const today = getJakartaDateParts(now);
  const startDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const diffFromFriday = (today.weekdayIndex - FRIDAY_INDEX + 7) % 7;
  startDate.setUTCDate(startDate.getUTCDate() - diffFromFriday);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const fromDate = formatDateInput(startDate);
  const toDate = formatDateInput(endDate);
  const deadlineAtIso = `${toDate}T23:59:59.999+07:00`;

  return {
    from: new Date(`${fromDate}T00:00:00.000+07:00`),
    to: new Date(deadlineAtIso),
    fromDate,
    toDate,
    label: `${fromDate} s.d. ${toDate}`,
    deadlineAt: new Date(deadlineAtIso),
    deadlineAtIso,
  };
}

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const value = (type: string) => {
    const part = parts.find((entry) => entry.type === type)?.value;
    return part ? Number(part) : 0;
  };
  const weekdayText = parts.find((entry) => entry.type === "weekday")?.value;
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(weekdayText ?? "");

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    weekdayIndex: weekdayIndex < 0 ? 0 : weekdayIndex,
  };
}

function formatDateInput(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
  }).format(date);
}
