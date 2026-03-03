import {
  buildHourLabels,
  cityFromZone,
  formatClock,
  formatDayHeader,
  gmtOffset,
  minutesFromMidnightInZone,
} from "../../utils/timezoneUtils";

import TimelineGrid from "./TimelineGrid";
import MeetingBlocks from "./MeetingBlocks";

export default function TimezoneRow({
  tz,
  isPinned,
  now,
  use12h,
  baseDay,
  meetingsForDay,
  dayWindow,
  HOURS,
  PX_PER_HOUR,
  ROW_H,
  LABEL_COL_W,
  TIMELINE_W,
}) {
  const mins = minutesFromMidnightInZone(now, tz);
  const nowX = (mins / 60) * PX_PER_HOUR;
  const hourLabels = buildHourLabels(tz, use12h, baseDay);

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
              <div className="truncate text-sm font-semibold">{cityFromZone(tz)}</div>
              <div className="text-xs font-mono opacity-70">{gmtOffset(now, tz)}</div>
            </div>
            {isPinned && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                Primary
              </span>
            )}
          </div>

          <div className={isPinned ? "mt-1 text-sm text-white/75" : "mt-1 text-sm text-slate-600"}>
            {formatDayHeader(now, tz)}
          </div>

          <div className={isPinned ? "mt-2 font-mono text-sm tabular-nums text-white" : "mt-2 font-mono text-sm tabular-nums text-slate-900"}>
            {formatClock(now, tz, use12h)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative shrink-0 z-0" style={{ width: TIMELINE_W, height: ROW_H }}>
        <TimelineGrid HOURS={HOURS} PX_PER_HOUR={PX_PER_HOUR} hourLabels={hourLabels} />

        <MeetingBlocks
          tz={tz}
          use12h={use12h}
          meetingsForDay={meetingsForDay}
          dayWindow={dayWindow}
          PX_PER_HOUR={PX_PER_HOUR}
        />

        {/* Now line */}
        <div className="absolute top-0 bottom-0" style={{ left: nowX }}>
          <div className="h-full w-[2px] bg-red-500" />
          <div className="absolute top-2 left-2">
            <div className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              now
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-3 px-4">
          <div className="text-xs text-slate-500">(Meeting blocks go here later)</div>
        </div>
      </div>
    </div>
  );
}
