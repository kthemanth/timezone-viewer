import { DateTime } from "luxon"
import { BASE_TIMEZONE } from "./constants"

export function selectedDayUtcRange(selectedISO) {
  // selectedISO is like "2026-02-24" in BASE_TIMEZONE
  const start = DateTime.fromISO(selectedISO, { zone: BASE_TIMEZONE }).startOf("day")
  const end = start.plus({ days: 1 })

  return {
    startUtcMs: start.toUTC().toMillis(),
    endUtcMs: end.toUTC().toMillis(),
  }
}

export function meetingOverlapsRange(meeting, startUtcMs, endUtcMs) {
  const s = DateTime.fromISO(meeting.startUtc, { zone: "utc" }).toMillis()
  const e = DateTime.fromISO(meeting.endUtc, { zone: "utc" }).toMillis()
  return s < endUtcMs && e > startUtcMs
}

export function tzMeta(tz) {
  // Use "now" for offset/abbr display (good enough for MVP)
  const dt = DateTime.now().setZone(tz)
  return {
    offset: dt.toFormat("ZZ"), // +08:00
    abbr: dt.offsetNameShort,  // GMT+8 / PST etc (varies)
  }
}

export function minutesFromMidnightInZone(utcIso, tz) {
  const dt = DateTime.fromISO(utcIso, { zone: "utc" }).setZone(tz)
  return dt.hour * 60 + dt.minute + dt.second / 60
}
