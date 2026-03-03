export default function TimelineGrid({ HOURS, PX_PER_HOUR, hourLabels }) {
  return (
    <>
      {/* Background grid */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: HOURS }, (_, h) => (
          <div
            key={h}
            className={[
              "border-l border-slate-200",
              h % 2 === 1 ? "bg-slate-50" : "bg-white",
            ].join(" ")}
            style={{ width: PX_PER_HOUR }}
          />
        ))}
        <div className="border-l border-slate-200" />
      </div>

      {/* Horizontal guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 top-1/2 border-t border-slate-200/70" />
        <div className="absolute left-0 right-0 bottom-0 border-t border-slate-200/70" />
      </div>

      {/* Per-zone hour labels */}
      <div className="absolute left-0 top-2 right-0 flex pointer-events-none">
        {hourLabels.map((label, h) => (
          <div
            key={h}
            className="text-[11px] text-slate-500 px-2"
            style={{ width: PX_PER_HOUR }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
}
