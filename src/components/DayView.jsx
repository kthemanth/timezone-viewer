import { useMemo, useState } from "react"
import TimezoneSidebar from "./TimezoneSidebar"
import { defaultTimezones } from "../data/timezones"
import { mockMeetingsUTC } from "../data/meetings.day.mock"

import {
  minutesFromMidnightInZone,
  selectedDayUtcRange,
  meetingOverlapsRange,
} from "../utils/luxonTime"

import { DateTime } from "luxon"
import { BASE_TIMEZONE } from "../utils/constants"

// ===== Pixel Math =====
const HOURS = 24
const PX_PER_HOUR = 120
const PX_PER_SLOT = PX_PER_HOUR / 2 // 30-min
const TIMELINE_W = HOURS * PX_PER_HOUR // 2880px

const SIDEBAR_W = 320
const LABEL_COL_W = 220
const RULER_H = 40
const ROW_H = 88
const ROW_LABEL_H = 28
const ROW_TIMELINE_H = 60

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function isoToDate(iso) {
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

function hourLabelsForZone(selectedISO, tz) {
  const start = DateTime.fromISO(selectedISO, { zone: tz }).startOf("day")
  // 24 labels: 00:00, 01:00, ...
  return Array.from({ length: 24 }, (_, i) => start.plus({ hours: i }).toFormat("HH:mm"))
}

function baseStartOfSelectedDay(selectedISO) {
  return DateTime.fromISO(selectedISO, { zone: BASE_TIMEZONE }).startOf("day")
}

function labelsForRowFromBase(selectedISO, rowTz) {
  const baseStart = baseStartOfSelectedDay(selectedISO)
  return Array.from({ length: 24 }, (_, i) => {
    const dt = baseStart.plus({ hours: i }).setZone(rowTz)
    // If you want a tiny day hint when date differs:
    const dayHint = dt.toFormat("dd") !== baseStart.toFormat("dd") ? dt.toFormat("dd LLL") : ""
    return dt.toFormat("HH:mm")
  })
}


export default function DayView({ selectedISO, onBackToMonth }) {
  const [timezones, setTimezones] = useState(defaultTimezones)

  const addTimezone = (tzObj) => {
    if (timezones.some((t) => t.tz === tzObj.tz)) return
    setTimezones((prev) => [...prev, tzObj])
  }

  const removeTimezone = (id) => {
    setTimezones((prev) => prev.filter((t) => t.id !== id))
  }

  const { startUtcMs, endUtcMs } = useMemo(
    () => selectedDayUtcRange(selectedISO),
    [selectedISO]
  )

  const meetingsForDay = useMemo(() => {
    return mockMeetingsUTC.filter((m) => meetingOverlapsRange(m, startUtcMs, endUtcMs))
  }, [startUtcMs, endUtcMs])

  const nowUtcIso = new Date().toISOString()

  const meetingsByTz = useMemo(() => {
    const map = {}
    for (const tz of timezones) {
      map[tz.id] = meetingsForDay.map((m) => {
        const mStart = minutesFromMidnightInZone(m.startUtc, BASE_TIMEZONE)
        const mEnd = minutesFromMidnightInZone(m.endUtc, BASE_TIMEZONE)

        const x = (mStart / 60) * PX_PER_HOUR
        const w = ((mEnd - mStart) / 60) * PX_PER_HOUR

        const xClamped = clamp(x, 0, TIMELINE_W)
        const wClamped = clamp(w, 0, TIMELINE_W - xClamped)

        return { ...m, x: xClamped, w: wClamped }
      })
    }
    return map
  }, [timezones, meetingsForDay])

  const nowXByTz = useMemo(() => {
    const map = {}
    for (const tz of timezones) {
      const nowMin = minutesFromMidnightInZone(nowUtcIso, BASE_TIMEZONE)
      map[tz.id] = (nowMin / 60) * PX_PER_HOUR
    }
    return map
  }, [timezones, nowUtcIso])

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

      {/* Body: Sidebar + Timeline */}
      <div className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: `${SIDEBAR_W}px 1fr` }}>
        {/* Sidebar */}
        <div className="border-r border-slate-200 bg-white">
          <TimezoneSidebar
            timezones={timezones}
            onAdd={addTimezone}
            onRemove={removeTimezone}
          />
        </div>

        {/* Main timeline area */}
        <div className="overflow-hidden bg-white">
          {/* Vertical scroll container */}
          <div className="h-full overflow-y-auto">
            {/* Shared horizontal scroll container: ruler + rows (SYNCED) */}
            <div className="overflow-x-auto">
              {/* Inner width includes label column + timeline */}
              <div style={{ width: LABEL_COL_W + TIMELINE_W }}>
                {/* Ruler (sticky top) */}
                <div
                  className="sticky top-0 z-30 bg-white border-b border-slate-200"
                  style={{ height: RULER_H }}
                >
                  <div className="relative" style={{ height: RULER_H }}>
                    {/* Sticky label spacer */}
                    <div
                      className="sticky left-0 z-40 bg-white border-r border-slate-200"
                      style={{ width: LABEL_COL_W, height: RULER_H }}
                    />

                    {/* Hour ticks */}
                    <div
                      className="absolute top-0 bottom-0"
                      style={{ left: LABEL_COL_W, width: TIMELINE_W }}
                    >
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-slate-200"
                          style={{ left: i * PX_PER_HOUR }}
                        />
                      ))}
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

                {/* Rows */}
                <div>
                  {timezones.map((tz) => {
                    const nowX = nowXByTz[tz.id] ?? 0

                    return (
                      <div key={tz.id} className="border-b border-slate-100" style={{ height: ROW_H }}>
                        <div className="relative h-full">
                          {/* Sticky label column (TRUE sticky) */}
                          <div
                            className="sticky left-0 z-20 bg-white border-r border-slate-200 px-4 py-3"
                            style={{ width: LABEL_COL_W, height: ROW_H }}
                          >
                            <div className="text-sm font-medium leading-tight">
                              {tz.label}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {tz.tz}
                            </div>
                          </div>

                          {/* Timeline lane */}
                          <div
                            className="absolute top-0 bottom-0"
                            style={{ left: LABEL_COL_W, width: TIMELINE_W }}
                          >
                            {labelsForRowFromBase(selectedISO, tz.tz).map((label, i) => (
                              <div
                                key={i}
                                className="absolute top-2 text-[11px] text-slate-400 select-none"
                                style={{ left: i * PX_PER_HOUR + 4 }}
                              >
                                {label}
                              </div>
                            ))}
                            {/* Working hours shading placeholder (9–18 local) */}
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

                            {/* 30-min grid */}
                            {Array.from({ length: 49 }).map((_, i) => (
                              <div
                                key={i}
                                className="absolute top-[28px] bottom-0 border-l border-slate-100"
                                style={{ left: i * PX_PER_SLOT }}
                              />
                            ))}

                            {/* Meetings */}
                            {(meetingsByTz[tz.id] ?? []).map((m) => (
                              <div
                                key={m.id}
                                className="absolute top-[36px] h-[44px] rounded-xl bg-slate-900 text-white text-xs px-2 flex items-center shadow-sm"
                                style={{ left: m.x, width: Math.max(12, m.w) }}
                                title={m.title}
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
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
