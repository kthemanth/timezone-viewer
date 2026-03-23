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
              className="h-full text-[11px] px-2 flex items-center gap-2 overflow-hidden"
              style={{
                borderRadius: 8,
                border: `1px solid ${hexToRgba(m.color, 0.35)}`,
                backgroundColor: hexToRgba(m.color, 0.12),
              }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="truncate font-medium text-white">{m.title}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-white/70">
                {startTxt}–{endTxt}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
