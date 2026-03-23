export default function TimelineGrid({ HOURS, PX_PER_HOUR, hourLabels, currentHourIndex }) {
  return (
    <>
      {/* Background grid */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: HOURS }, (_, h) => (
          <div
            key={h}
            style={{
              width: PX_PER_HOUR,
              borderLeft: "1px solid rgba(255,255,255,0.03)",
              background:
                h === currentHourIndex
                  ? "rgba(99,102,241,0.05)"
                  : "transparent",
            }}
          />
        ))}
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.03)" }} />
      </div>

      {/* Horizontal guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-0 right-0 top-1/2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        />
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        />
      </div>

      {/* Per-zone hour labels */}
      <div className="absolute left-0 top-2 right-0 flex pointer-events-none">
        {hourLabels.map((label, h) => (
          <div
            key={h}
            className="font-mono text-[9px] px-2"
            style={{
              width: PX_PER_HOUR,
              color: h === currentHourIndex ? "#818cf8" : "#374151",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
}
