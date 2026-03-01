import { useMemo, useState } from "react"
import { buildMonthGrid } from "../utils/calendar"
import { mockMeetingsByDate } from "../data/meetings.mock"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function pad2(n) {
  return String(n).padStart(2, "0")
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatMonthYear(d) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export default function MonthView({ selectedISO, onSelectDay }) {
  // "anchor" date determines which month we display
  const [anchor, setAnchor] = useState(() => new Date())

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor])

  const goPrevMonth = () => {
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const goNextMonth = () => {
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }
  const goToday = () => {
    const t = new Date()
    setAnchor(new Date(t.getFullYear(), t.getMonth(), 1))
    onSelectDay(toISODate(t)) // this will also set selected date; App decides view
  }

  const onDayClick = (day) => {
    const iso = toISODate(day.date)
    onSelectDay(iso) // App switches to day view
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrevMonth}
            className="rounded-xl bg-slate-100 hover:bg-slate-200"
            aria-label="Previous month"
          >
            ◀
          </button>
          <button
            onClick={goNextMonth}
            className="rounded-xl bg-slate-100 hover:bg-slate-200"
            aria-label="Next month"
          >
            ▶
          </button>
          <div className="text-lg font-semibold">{formatMonthYear(anchor)}</div>
          <button
            onClick={goToday}
            className="px-3 rounded-xl bg-red-500 text-white text-sm hover:bg-red-800"
          >
            Today
          </button>
        </div>

        <div className="text-sm text-slate-500">
          Click a day to open multi-timezone view
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 text-slate-500 text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="select-none">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 pb-6">
        <div className="h-full grid grid-cols-7 auto-rows-fr gap-2">
          {grid.map((day) => {
            const iso = toISODate(day.date)
            const isSelected = iso === selectedISO
            const isToday = iso === toISODate(new Date())
            const meetings = mockMeetingsByDate[iso] ?? []

            return (
              <button
                key={iso}
                onClick={() => onDayClick(day)}
                className={[
                  "rounded-xl border text-left p-2 transition-colors overflow-hidden",
                  day.inCurrentMonth
                    ? "bg-white border-slate-200 hover:bg-slate-50 hover:border-red-600"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100",
                  isSelected ? "ring-2 ring-slate-900" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={[
                      "text-xs",
                      day.inCurrentMonth ? "text-slate-900" : "text-slate-500",
                    ].join(" ")}
                  >
                    {day.date.getDate()}
                  </div>

                  {isToday && (
                    <div className="text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white">
                      Today
                    </div>
                  )}
                </div>

                {/* Meeting pills (max 3 + overflow indicator) */}
                <div className="mt-2 space-y-1">
                  {meetings.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="h-5 rounded-md bg-slate-100 text-[11px] px-2 flex items-center truncate"
                      title={`${m.start} ${m.title}`}
                    >
                      <span className="text-slate-500 mr-2">{m.start}</span>
                      <span className="truncate">{m.title}</span>
                    </div>
                  ))}

                  {meetings.length > 3 && (
                    <div className="text-[11px] text-slate-500 px-1">
                      +{meetings.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
