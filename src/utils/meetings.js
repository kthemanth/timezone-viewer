import { DateTime } from "luxon";
import { SINGAPORE_TZ } from "../data/timezones";

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function hexToRgba(hex, alpha = 0.18) {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(37, 99, 235, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getSingaporeDayWindow(baseDay) {
  const daySG = DateTime.fromJSDate(baseDay).setZone(SINGAPORE_TZ).startOf("day");
  return {
    daySG,
    dayStartUtc: daySG.toUTC(),
    dayEndUtc: daySG.plus({ days: 1 }).toUTC(),
  };
}

export function meetingOverlapsDay(m, dayStartUtc, dayEndUtc) {
  const s = DateTime.fromISO(m.startUtcISO, { zone: "utc" });
  const e = DateTime.fromISO(m.endUtcISO, { zone: "utc" });
  return e > dayStartUtc && s < dayEndUtc;
}

export function meetingSegmentForZone({
  meeting,
  tz,
  daySG,
  dayStartUtc,
  dayEndUtc,
  pxPerHour,
}) {
  const sUtc = DateTime.fromISO(meeting.startUtcISO, { zone: "utc" });
  const eUtc = DateTime.fromISO(meeting.endUtcISO, { zone: "utc" });

  const clippedStartUtc = sUtc < dayStartUtc ? dayStartUtc : sUtc;
  const clippedEndUtc = eUtc > dayEndUtc ? dayEndUtc : eUtc;
  if (clippedEndUtc <= clippedStartUtc) return null;

  const rowDayStart = daySG.setZone(tz).startOf("day");
  const startLocal = clippedStartUtc.setZone(tz);
  const endLocal = clippedEndUtc.setZone(tz);

  const startMins = startLocal.diff(rowDayStart, "minutes").minutes;
  const endMins = endLocal.diff(rowDayStart, "minutes").minutes;

  const leftMins = clamp(startMins, 0, 1440);
  const rightMins = clamp(endMins, 0, 1440);
  if (rightMins <= leftMins) return null;

  return {
    leftPx: (leftMins / 60) * pxPerHour,
    widthPx: ((rightMins - leftMins) / 60) * pxPerHour,
    startLocal,
    endLocal,
  };
}

export function makeMeetingId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function buildMeetingFromForm(form) {
  const [sh, sm] = form.startHHMM.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = form.endHHMM.split(":").map((x) => parseInt(x, 10));

  const startSg = DateTime.fromISO(form.dateISO, { zone: SINGAPORE_TZ }).set({
    hour: sh, minute: sm, second: 0, millisecond: 0,
  });

  let endSg = DateTime.fromISO(form.dateISO, { zone: SINGAPORE_TZ }).set({
    hour: eh, minute: em, second: 0, millisecond: 0,
  });

  if (endSg <= startSg) endSg = endSg.plus({ days: 1 });

  return {
    id: makeMeetingId(),
    title: form.title.trim(),
    startUtcISO: startSg.toUTC().toISO(),
    endUtcISO: endSg.toUTC().toISO(),
    location: (form.location || "").trim(),
    notes: (form.notes || "").trim(),
    color: form.color || "#2563eb",
  };
}
