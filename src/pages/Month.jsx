import { useMemo, useState } from "react";
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const ICON_SIZE = 30;

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year, monthIndex, weekStartsOn = 0) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0..6
  const offset = (firstWeekday - weekStartsOn + 7) % 7;

  const gridStart = new Date(year, monthIndex, 1 - offset);
  const today = new Date();

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );

    return {
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday: sameDay(date, today),
      iso: toISODate(date),
      weekday: date.getDay(),
    };
  });
}

export default function Month() {
  const today = new Date();

  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));

  const monthLabel = useMemo(() => {
    const d = new Date(view.year, view.monthIndex, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [view.year, view.monthIndex]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells = useMemo(
    () => buildMonthGrid(view.year, view.monthIndex, 0),
    [view.year, view.monthIndex]
  );

  function prevMonth() {
    setView((v) => {
      const d = new Date(v.year, v.monthIndex - 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function nextMonth() {
    setView((v) => {
      const d = new Date(v.year, v.monthIndex + 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function goToday() {
    const d = new Date();
    setView({ year: d.getFullYear(), monthIndex: d.getMonth() });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-bold">{monthLabel}</h2>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={goToday}
          >
            Today
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="hover:text-blue-500 transition-colors"
            aria-label="Previous month"
            title="Previous month"
          >
            <FaArrowCircleLeft size={ICON_SIZE} />
          </button>
          <button
            onClick={nextMonth}
            className="hover:text-blue-500 transition-colors"
            aria-label="Next month"
            title="Next month"
          >
            <FaArrowCircleRight size={ICON_SIZE} />
          </button>
        </div>
      </div>

      {/* WEEKDAY HEADER */}
      <div className="grid grid-cols-7 text-sm font-semibold text-center border-b pb-2 text-slate-700">
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* CALENDAR GRID (always 6 rows) */}
      {/* Key change: no big slate background. Use subtle borders instead. */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr mt-2 rounded-2xl overflow-hidden border border-slate-200 bg-white">
        {cells.map((cell) => {
          const isWeekend = cell.weekday === 0 || cell.weekday === 6;

          // Make out-of-month days feel "gone":
          // - white background (same as page)
          // - very low-contrast text
          // - no hover emphasis
          const isOut = !cell.inMonth;

          const cellClass = [
            "p-2 border-r border-b border-slate-200 last:border-r-0",
            "transition-colors",
            isOut
              ? "bg-white text-slate-200 hover:bg-white"
              : isWeekend
              ? "bg-slate-100 text-slate-700 hover:bg-slate-100"
              : "bg-white text-slate-700 hover:bg-slate-50",
            "focus:outline-none focus:ring-2 focus:ring-slate-300",
            "group",
          ].join(" ");

          const pillClass = [
            "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full tabular-nums",
            isOut
              ? "text-slate-200"
              : cell.isToday
              ? "bg-red-500 text-white"
              : "text-slate-700 group-hover:bg-slate-200",
          ].join(" ");

          // Optional: make out-of-month cells slightly less “clickable”
          const ariaLabel = isOut
            ? `Out of month day ${cell.iso}`
            : `Open day view for ${cell.iso}`;

          return (
            <Link
              key={cell.iso}
              to={`/day/${cell.iso}`}
              aria-label={ariaLabel}
              className={cellClass}
            >
              <div className="flex items-start justify-between">
                <span className={pillClass}>
                  {String(cell.day).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-2 space-y-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
