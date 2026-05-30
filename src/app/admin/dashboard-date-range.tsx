"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const dayMs = 24 * 60 * 60 * 1000;
const rangeDays = 90;
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type PresetKey =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

const presetOptions: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "last7", label: "7 Hari" },
  { key: "last30", label: "30 Hari" },
  { key: "thisMonth", label: "Bulan Ini" },
  { key: "lastMonth", label: "Bulan Lalu" },
  { key: "custom", label: "Custom" },
];

function computePresetRange(key: PresetKey, today: Date) {
  if (key === "today") {
    return { start: today, end: today };
  }

  if (key === "last7") {
    return { start: addDays(today, -6), end: today };
  }

  if (key === "last30") {
    return { start: addDays(today, -29), end: today };
  }

  if (key === "thisMonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end: today };
  }

  if (key === "lastMonth") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start, end };
  }

  return null;
}

function detectPreset(start: Date, end: Date, today: Date): PresetKey {
  for (const option of presetOptions) {
    if (option.key === "custom") {
      continue;
    }

    const range = computePresetRange(option.key, today);
    if (
      range &&
      formatDate(range.start) === formatDate(start) &&
      formatDate(range.end) === formatDate(end)
    ) {
      return option.key;
    }
  }

  return "custom";
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function clampDate(date: Date, minDate: Date, maxDate: Date) {
  if (date.getTime() < minDate.getTime()) {
    return minDate;
  }

  if (date.getTime() > maxDate.getTime()) {
    return maxDate;
  }

  return date;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeRange(start: Date, end: Date) {
  return start.getTime() <= end.getTime()
    ? { start, end }
    : { start: end, end: start };
}

function getMonthDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const leadingEmptyDays = firstDay.getDay();
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  return {
    leadingEmptyDays,
    days: Array.from(
      { length: daysInMonth },
      (_, index) =>
        new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1),
    ),
  };
}

export function DashboardDateRange({
  from,
  to,
}: {
  from: string | null;
  to: string | null;
}) {
  const router = useRouter();
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const minDate = useMemo(() => addDays(today, -rangeDays), [today]);
  const initialRange = useMemo(() => {
    const start = clampDate(parseDate(from) ?? minDate, minDate, today);
    const end = clampDate(parseDate(to) ?? today, minDate, today);
    return normalizeRange(start, end);
  }, [from, minDate, today, to]);

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>(() =>
    detectPreset(initialRange.start, initialRange.end, today),
  );
  const [firstMonth, setFirstMonth] = useState(
    new Date(
      initialRange.start.getFullYear(),
      initialRange.start.getMonth(),
      1,
    ),
  );

  const safeRange = normalizeRange(startDate, endDate);
  const startValue = formatDate(safeRange.start);
  const endValue = formatDate(safeRange.end);
  const visibleMonths = [firstMonth, addMonths(firstMonth, 1)];
  const rangeLabel = `${formatDisplayDate(safeRange.start)} - ${formatDisplayDate(safeRange.end)}`;

  function navigateRange(start: Date, end: Date) {
    const params = new URLSearchParams(window.location.search);
    params.set("from", formatDate(start));
    params.set("to", formatDate(end));
    router.replace(`/admin?${params.toString()}`);
  }

  function handlePresetChange(key: PresetKey) {
    setActivePreset(key);
    if (key === "custom") {
      setOpen(true);
      return;
    }

    const preset = computePresetRange(key, today);
    if (!preset) {
      return;
    }

    const start = clampDate(preset.start, minDate, today);
    const end = clampDate(preset.end, minDate, today);
    setStartDate(start);
    setEndDate(end);
    setFirstMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    setSelectingEnd(false);
    setOpen(false);
    navigateRange(start, end);
  }

  function pickDate(date: Date) {
    if (!selectingEnd) {
      setStartDate(date);
      setEndDate(date);
      setSelectingEnd(true);
      return;
    }

    if (date.getTime() < startDate.getTime()) {
      setStartDate(date);
      setEndDate(date);
      setSelectingEnd(true);
      return;
    }

    setEndDate(date);
    setSelectingEnd(false);
  }

  function applyRange() {
    setActivePreset(detectPreset(safeRange.start, safeRange.end, today));
    setOpen(false);
    navigateRange(safeRange.start, safeRange.end);
  }

  function setEndToToday() {
    const nextStart = startDate.getTime() > today.getTime() ? today : startDate;
    setStartDate(nextStart);
    setEndDate(today);
    setFirstMonth(new Date(nextStart.getFullYear(), nextStart.getMonth(), 1));
    setSelectingEnd(false);
  }

  function resetRange() {
    const defaultStart = minDate;
    const defaultEnd = today;
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setFirstMonth(
      new Date(defaultStart.getFullYear(), defaultStart.getMonth(), 1),
    );
    setSelectingEnd(false);
    setOpen(false);
    setActivePreset(detectPreset(defaultStart, defaultEnd, today));
    navigateRange(defaultStart, defaultEnd);
  }

  return (
    <div className="relative lg:min-w-110">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="dashboard-period-preset">
          Preset periode dashboard
        </label>
        <div className="relative">
          <select
            id="dashboard-period-preset"
            value={activePreset}
            onChange={(event) =>
              handlePresetChange(event.target.value as PresetKey)
            }
            className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-36"
          >
            {presetOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            ▾
          </span>
        </div>
        {activePreset === "custom" ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-label="Pilih periode dashboard"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">🗓</span>
              <span>{rangeLabel}</span>
            </span>
            <span className="text-slate-400">▾</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-3 w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
                Pilih Periode
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectingEnd ? "Pilih tanggal akhir." : "Pilih tanggal mulai."}{" "}
                {startValue} s.d. {endValue}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFirstMonth(addMonths(firstMonth, -1))}
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Bulan sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setFirstMonth(addMonths(firstMonth, 1))}
                className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Bulan berikutnya"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {visibleMonths.map((month) => (
              <MonthCalendar
                key={formatDate(month)}
                month={month}
                minDate={minDate}
                maxDate={today}
                startDate={safeRange.start}
                endDate={safeRange.end}
                onPick={pickDate}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetRange}
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={setEndToToday}
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={applyRange}
              className="min-h-10 rounded-lg bg-green-700 px-4 text-sm font-bold text-white hover:bg-green-800"
            >
              Terapkan
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MonthCalendar({
  month,
  minDate,
  maxDate,
  startDate,
  endDate,
  onPick,
}: {
  month: Date;
  minDate: Date;
  maxDate: Date;
  startDate: Date;
  endDate: Date;
  onPick: (date: Date) => void;
}) {
  const { leadingEmptyDays, days } = getMonthDays(month);

  return (
    <div>
      <p className="text-center text-sm font-bold text-slate-950 dark:text-slate-50">
        {monthNames[month.getMonth()]} {month.getFullYear()}
      </p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold text-slate-500 dark:text-slate-400">
        {weekdayLabels.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingEmptyDays }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {days.map((date) => {
          const time = date.getTime();
          const disabled = time < minDate.getTime() || time > maxDate.getTime();
          const isStart = formatDate(date) === formatDate(startDate);
          const isEnd = formatDate(date) === formatDate(endDate);
          const inRange =
            time >= startDate.getTime() && time <= endDate.getTime();

          return (
            <button
              key={formatDate(date)}
              type="button"
              onClick={() => onPick(date)}
              disabled={disabled}
              className={`min-h-11 rounded-lg border px-1 py-1 text-center text-xs transition disabled:cursor-not-allowed disabled:opacity-35 ${
                isStart || isEnd
                  ? "border-green-700 bg-green-700 font-bold text-white"
                  : inRange
                    ? "border-green-100 bg-green-50 font-semibold text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
                    : "border-slate-100 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-green-800 dark:hover:bg-green-950"
              }`}
              aria-label={`Pilih ${formatDisplayDate(date)}`}
            >
              <span className="block text-sm leading-4">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
