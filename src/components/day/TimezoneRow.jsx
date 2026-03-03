import { DateTime } from "luxon";
import {
  cityFromZone,
  formatClock,
  formatDayHeader,
  gmtOffset,
} from "../../utils/timezoneUtils";

import TimelineGrid from "./TimelineGrid";

function buildAxisHourLabels(dayStartUtc, tz, use12h) {
  return Array.from({ length: 24 }, (_, h) => {
    const dt = dayStartUtc.plus({ hours: h }).setZone(tz);
    return use12h ? dt.toFormat("ha").toLowerCase() : dt.toFormat("HH:00");
  });
}

function xForInstant(dayStartUtc, instantUtc, pxPerHour) {
  const mins = instantUtc.diff(dayStartUtc, "minutes").minutes;
  return (mins / 60) * pxPerHour;
}

export default function TimezoneRow({
  tz,
  isPinned,
  now,
  use12h,
  dayWindow,
  HOURS,
  PX_PER_HOUR,
  ROW_H,
  LABEL_COL_W,
  TIMELINE_W,
}) {
  const { dayStartUtc } = dayWindow;
  const city = cityFromZone(tz);
  const gmt = gmtOffset(now, tz);

  // Labels reflect the SAME timeline (SG day), displayed in each zone’s local time
  const hourLabels = buildAxisHourLabels(dayStartUtc, tz, use12h);

  // Now line is positioned by "now" relative to SG-day start (shared axis)
  const nowUtc = DateTime.fromJSDate(now).toUTC();
  let nowX = xForInstant(dayStartUtc, nowUtc, PX_PER_HOUR);

  // Clamp to visible 0..24h (optional)
  nowX = Math.max(0, Math.min(TIMELINE_W, nowX));

  return (
    <div className="flex" style={{ minWidth: LABEL_COL_W + TIMELINE_W }}>
      {/* Sticky timezone label */}
      <div
        className={[
          "shrink-0 border-r border-slate-200 sticky left-0 z-[60]",
          "shadow-[6px_0_10px_-10px_rgba(0,0,0,0.35)]",
          isPinned ? "bg-slate-900 text-white" : "bg-white text-slate-900",
        ].join(" ")}
        style={{ width: LABEL_COL_W, height: ROW_H }}
      >
        <div className="h-full px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-between gap-1">
              <div className="truncate text-sm font-semibold">{`${city} (${gmt})`}</div>
            </div>
            {isPinned && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                Primary
              </span>
            )}
          </div>

          <div className={isPinned ? "mt-1 text-[13px] text-white/75" : "mt-1 text-[13px] text-slate-600"}>
            {formatDayHeader(now, tz)} • {tz}
          </div>

          <div
            className={
              isPinned
                ? "mt-2 font-mono text-lg tabular-nums text-white"
                : "mt-2 font-mono text-lg tabular-nums text-slate-900"
            }
          >
            {formatClock(now, tz, use12h)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative shrink-0 z-0" style={{ width: TIMELINE_W, height: ROW_H }}>
        <TimelineGrid HOURS={HOURS} PX_PER_HOUR={PX_PER_HOUR} hourLabels={hourLabels} />

        {/* Now line */}
        <div className="absolute top-0 bottom-0" style={{ left: nowX }}>
          <div className="h-full w-[2px] bg-red-500" />
        </div>
      </div>
    </div>
  );
}
