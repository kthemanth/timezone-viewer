import { DateTime } from "luxon";
import { TIMEZONE_OPTIONS } from "../data/timezones";

export function safeZoneLabel(tz) {
  return TIMEZONE_OPTIONS.find((x) => x.id === tz)?.label ?? tz;
}

export function cityFromZone(tz) {
  const opt = TIMEZONE_OPTIONS.find((x) => x.id === tz);
  if (!opt) return tz;
  const cut = opt.label.indexOf(" (");
  return cut >= 0 ? opt.label.slice(0, cut) : opt.label;
}

export function gmtOffset(now, tz) {
  const dt = DateTime.fromJSDate(now).setZone(tz);
  const offset = dt.offset;
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const mins = abs % 60;
  return mins === 0 ? `GMT${sign}${hours}` : `GMT${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

export function formatDayHeader(now, tz) {
  return DateTime.fromJSDate(now).setZone(tz).toFormat("ccc, dd LLL yyyy");
}

export function formatClock(now, tz, use12h) {
  const dt = DateTime.fromJSDate(now).setZone(tz);
  return use12h ? dt.toFormat("hh:mm a") : dt.toFormat("HH:mm");
}

export function minutesFromMidnightInZone(now, tz) {
  const dt = DateTime.fromJSDate(now).setZone(tz);
  return dt.hour * 60 + dt.minute + dt.second / 60;
}

export function buildHourLabels(timeZone, use12h, baseDate) {
  const base = DateTime.fromJSDate(baseDate).setZone(timeZone).startOf("day");
  return Array.from({ length: 24 }, (_, h) => {
    const dt = base.plus({ hours: h });
    return use12h ? dt.toFormat("ha").toLowerCase() : dt.toFormat("HH:00");
  });
}
