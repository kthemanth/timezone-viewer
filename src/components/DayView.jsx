import { useMemo } from "react"
import { defaultTimezones } from "../data/timezones"
import { mockMeetingsUTC } from "../data/meetings.day.mock"
import { minutesFromLocalMidnight } from "../utils/timezone"

// ===== Pixel Math =====
const HOURS = 24
const PX_PER_HOUR = 120
const PX_PER_SLOT = PX_PER_HOUR / 2 // 30-min slot
const TIMELINE_W = HOURS * PX_PER_HOUR // 2880px
const LABEL_COL_W = 220
const RULER_H = 40
const ROW_H = 88
const ROW_LABEL_H = 28
const ROW_TIMELINE_H = 60

function isoToDate(iso) {
  // iso like "2026-02-24"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function formatFullDate(iso) {
  const d = isoToDate(iso)
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export default function DayView({ selectedISO, onBackToMonth }) {
  const timezones = defaultTimezones

  // "Now" line: we compute per timezone row (since local midnight differs).
  const now = new Date()

  // Precompute meeting blocks per timezone: x + w positions
  const meetingsByTz = useMemo(() => {
    const map = {}
    for (const tz of timezones) {
      map[tz.id] = mockMeetingsUTC.map((m) => {
        const start = new Date(m.startUtc)
        const end = new Date(m.endUtc)

        const mStart = minutesFromLocalMidnight(start, tz.tz)
        const mEnd = minutesFromLocalMidnight(end, tz.tz)

        // pixel positions
        const x = (mStart / 60) * PX_PER_HOUR
        const w = ((mEnd - mStart) / 60) * PX_PER_HOUR

        // clamp inside day timeline (simple MVP handling)
        const xClamped = clamp(x, 0, TIMELINE_W)
        const wClamped = clamp(w, 0, TIMELINE_W - xClamped)

        return {
          ...m,
          x: xClamped,
          w: wClamped,
        }
      })
    }
    return map
  }, [timezones])

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMonth}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            ← Month
          </button>
          <div className="text-lg font-semibold">{formatFullDate(selectedISO)}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-xl bg-slate-100 text-sm hover:bg-slate-200">
            Today
          </button>
          <button className="h-9 px-3 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">
            + New Meeting
          </button>
        </div>
      </div>

      {/* Ruler + rows */}
      <div className="flex-1 overflow-hidden">
        {/* Ruler row */}
        <div className="h-10 border-b border-slate-200 flex">
          <div className="w-[220px] bg-white" />
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="relative h-10" style={{ width: TIMELINE_W }}>
              {/* hour ticks */}
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-slate-200"
                  style={{ left: i * PX_PER_HOUR }}
                />
              ))}
              {/* labels */}
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-2 text-[11px] text-slate-500 select-none"
                  style={{ left: i * PX_PER_HOUR + 4 }}
                >
                  {String(i).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows area (vertical scroll) */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Left labels column */}
            <div className="w-[220px] border-r border-slate-200 bg-white">
              {/* Keep empty; labels are in each row for alignment */}
            </div>

            {/* Right: horizontal scrolling container */}
            <div className="flex-1 overflow-x-auto">
              <div style={{ minWidth: TIMELINE_W }}>
                {timezones.map((tz) => {
                  const nowMin = minutesFromLocalMidnight(now, tz.tz)
                  const nowX = (nowMin / 60) * PX_PER_HOUR

                  return (
                    <div key={tz.id} className="flex border-b border-slate-100">
                      {/* Label cell (overlay aligned with left column) */}
                      <div
                        className="w-[220px] px-4 py-3 bg-white border-r border-slate-200"
                        style={{ marginLeft: -LABEL_COL_W }}
                      >
                        <div className="text-sm font-medium leading-tight">
                          {tz.label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tz.abbr} · UTC{tz.utc}
                        </div>
                      </div>

                      {/* Timeline row */}
                      <div
                        className="relative"
                        style={{ height: ROW_H, width: TIMELINE_W }}
                      >
                        {/* 30-min grid */}
                        {Array.from({ length: 49 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-[28px] bottom-0 border-l border-slate-100"
                            style={{ left: i * PX_PER_SLOT }}
                          />
                        ))}

                        {/* “working hours” shading placeholder (9–18 local) */}
                        <div
                          className="absolute top-[28px] h-[60px] bg-slate-50"
                          style={{ left: 0, width: 9 * PX_PER_HOUR }}
                        />
                        <div
                          className="absolute top-[28px] h-[60px] bg-white"
                          style={{ left: 9 * PX_PER_HOUR, width: 9 * PX_PER_HOUR }}
                        />
                        <div
                          className="absolute top-[28px] h-[60px] bg-slate-50"
                          style={{ left: 18 * PX_PER_HOUR, width: 6 * PX_PER_HOUR }}
                        />

                        {/* Meeting blocks */}
                        {meetingsByTz[tz.id].map((m) => (
                          <div
                            key={m.id}
                            className="absolute top-[36px] h-[44px] rounded-xl bg-slate-900 text-white text-xs px-2 flex items-center shadow-sm"
                            style={{ left: m.x, width: Math.max(12, m.w) }}
                            title={`${m.title}`}
                          >
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}

                        {/* Now line */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-500"
                          style={{ left: clamp(nowX, 0, TIMELINE_W) }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
