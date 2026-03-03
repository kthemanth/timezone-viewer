import { useRef } from "react";
import { DateTime } from "luxon";
import { hexToRgba, clamp } from "../../utils/meetings";

export default function MeetingBands({
  meetingsForDay,
  dayWindow,
  rowCount,
  ROW_H,
  PX_PER_HOUR,
  LABEL_COL_W,
  TIMELINE_W,
  use12h,
  onEditMeeting,
  onMoveMeeting,
}) {
  const { dayStartUtc, dayEndUtc } = dayWindow;

  const dayStart = DateTime.isDateTime(dayStartUtc)
    ? dayStartUtc
    : DateTime.fromISO(dayStartUtc, { zone: "utc" });

  const dayEnd = DateTime.isDateTime(dayEndUtc)
    ? dayEndUtc
    : DateTime.fromISO(dayEndUtc, { zone: "utc" });

  const totalHeight = rowCount * ROW_H;
  const totalWidth = LABEL_COL_W + TIMELINE_W;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-[50]"
      style={{
        width: totalWidth,
        height: totalHeight,
      }}
    >
      {meetingsForDay.map((m, i) => {
        const sUtc = DateTime.fromISO(m.startUtcISO, { zone: "utc" });
        const eUtc = DateTime.fromISO(m.endUtcISO, { zone: "utc" });

        const clippedStart = sUtc.toMillis() < dayStart.toMillis() ? dayStart : sUtc;
        const clippedEnd = eUtc.toMillis() > dayEnd.toMillis() ? dayEnd : eUtc;

        if (clippedEnd.toMillis() <= clippedStart.toMillis()) return null;

        const minsFromStart = clippedStart.diff(dayStart, "minutes").minutes;
        const minsToEnd = clippedEnd.diff(dayStart, "minutes").minutes;

        const leftMins = clamp(minsFromStart, 0, 1440);
        const rightMins = clamp(minsToEnd, 0, 1440);
        if (rightMins <= leftMins) return null;

        const leftPx = (leftMins / 60) * PX_PER_HOUR;
        const widthPx = ((rightMins - leftMins) / 60) * PX_PER_HOUR;

        const sSG = clippedStart.setZone("Asia/Singapore");
        const eSG = clippedEnd.setZone("Asia/Singapore");

        const timeTxt = use12h
          ? `${sSG.toFormat("h:mm a")}–${eSG.toFormat("h:mm a")}`
          : `${sSG.toFormat("HH:mm")}–${eSG.toFormat("HH:mm")}`;

        const laneOffset = (i % 3) * 8;

        return (
          <MeetingBand
            key={m.id}
            meeting={m}
            leftPx={leftPx}
            widthPx={widthPx}
            totalHeight={totalHeight}
            labelTop={25 + laneOffset}
            timeTxt={timeTxt}
            LABEL_COL_W={LABEL_COL_W}
            PX_PER_HOUR={PX_PER_HOUR}
            onEditMeeting={onEditMeeting}
            onMoveMeeting={onMoveMeeting}
          />
        );
      })}
    </div>
  );
}

function MeetingBand({
  meeting,
  leftPx,
  widthPx,
  totalHeight,
  labelTop,
  timeTxt,
  LABEL_COL_W,
  PX_PER_HOUR,
  onEditMeeting,
  onMoveMeeting,
}) {
  const dragStartRef = useRef(null);

  function handlePointerDown(event) {
    dragStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragStartRef.current.x;
    if (Math.abs(dx) >= 6) {
      dragStartRef.current.moved = true;
    }
  }

  function handlePointerUp(event) {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) return;

    const dx = event.clientX - dragStartRef.current.x;
    const wasDragged = dragStartRef.current.moved;
    const rawMinutes = (dx / PX_PER_HOUR) * 60;
    const snapped = Math.round(rawMinutes / 15) * 15;

    dragStartRef.current = null;

    if (wasDragged && snapped !== 0) {
      onMoveMeeting?.(meeting.id, snapped);
      return;
    }

    onEditMeeting?.(meeting.id);
  }

  return (
    <div
      className="absolute"
      style={{
        left: LABEL_COL_W + leftPx,
        top: 0,
        width: widthPx,
        height: totalHeight,
      }}
      title={`${meeting.title}\n${timeTxt}${meeting.location ? `\n${meeting.location}` : ""}`}
    >
      <div
        className="h-full rounded-sm border"
        style={{
          borderColor: meeting.color,
          backgroundColor: hexToRgba(meeting.color, 0.08),
        }}
      />

      <div className="absolute left-2 pointer-events-auto" style={{ top: labelTop }}>
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="rounded-sm border px-3 py-1 bg-white/90 backdrop-blur shadow-sm max-w-[360px] cursor-grab active:cursor-grabbing"
          style={{ borderColor: meeting.color }}
          title="Click to edit or drag horizontally to reschedule"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: meeting.color }}
            />
            <span className="truncate text-[12px] font-semibold text-slate-900">{meeting.title}</span>
          </div>
          <div className="mt-0.5 text-left text-[10px] font-mono text-slate-600">{timeTxt} SGT</div>
        </button>
      </div>
    </div>
  );
}
