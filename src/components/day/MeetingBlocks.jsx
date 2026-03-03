import { meetingSegmentForZone, hexToRgba } from "../../utils/meetings";

export default function MeetingBlocks({
  tz,
  use12h,
  meetingsForDay,
  dayWindow,
  PX_PER_HOUR,
}) {
  const { daySG, dayStartUtc, dayEndUtc } = dayWindow;

  return (
    <div className="absolute inset-0">
      {meetingsForDay.map((m, i) => {
        const seg = meetingSegmentForZone({
          meeting: m,
          tz,
          daySG,
          dayStartUtc,
          dayEndUtc,
          pxPerHour: PX_PER_HOUR,
        });

        if (!seg) return null;

        const startTxt = use12h ? seg.startLocal.toFormat("h:mm a") : seg.startLocal.toFormat("HH:mm");
        const endTxt = use12h ? seg.endLocal.toFormat("h:mm a") : seg.endLocal.toFormat("HH:mm");

        // Simple stacking lanes (3 lanes)
        const top = 30 + (i % 3) * 22;

        return (
          <div
            key={`${m.id}-${tz}`}
            className="absolute"
            style={{
              left: seg.leftPx,
              top,
              width: seg.widthPx,
              height: 20,
            }}
            title={`${m.title}\n${startTxt}–${endTxt}${m.location ? `\n${m.location}` : ""}`}
          >
            <div
              className="h-full rounded-lg border text-[11px] px-2 flex items-center gap-2 overflow-hidden"
              style={{
                borderColor: m.color,
                backgroundColor: hexToRgba(m.color, 0.2),
              }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="truncate font-medium text-slate-900">{m.title}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-700/80">
                {startTxt}–{endTxt}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
