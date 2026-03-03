import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

const SINGAPORE_TZ = "Asia/Singapore";
const STORAGE_KEY = "quinn_calendar_selected_timezones_v1";

const TIMEZONE_OPTIONS = [
  { id: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (Asia/Kuala_Lumpur)" },
  { id: "Asia/Bangkok", label: "Bangkok (Asia/Bangkok)" },
  { id: "Asia/Jakarta", label: "Jakarta (Asia/Jakarta)" },
  { id: "Asia/Hong_Kong", label: "Hong Kong (Asia/Hong_Kong)" },
  { id: "Asia/Shanghai", label: "Shanghai (Asia/Shanghai)" },
  { id: "Asia/Tokyo", label: "Tokyo (Asia/Tokyo)" },
  { id: "Asia/Seoul", label: "Seoul (Asia/Seoul)" },
  { id: "Australia/Sydney", label: "Sydney (Australia/Sydney)" },
  { id: "Europe/London", label: "London (Europe/London)" },
  { id: "Europe/Paris", label: "Paris (Europe/Paris)" },
  { id: "Europe/Berlin", label: "Berlin (Europe/Berlin)" },
  { id: "America/New_York", label: "New York (America/New_York)" },
  { id: "America/Chicago", label: "Chicago (America/Chicago)" },
  { id: "America/Denver", label: "Denver (America/Denver)" },
  { id: "America/Los_Angeles", label: "Los Angeles (America/Los_Angeles)" },
  { id: "UTC", label: "UTC" },
];

function safeZoneLabel(tz) {
  return TIMEZONE_OPTIONS.find((x) => x.id === tz)?.label ?? tz;
}

function loadZones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((x) => typeof x === "string"))).filter(
      (tz) => tz !== SINGAPORE_TZ
    );
  } catch {
    return [];
  }
}

function saveZones(zones) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
}

function minutesFromMidnightInZone(now, timeZone) {
  const dt = DateTime.fromJSDate(now).setZone(timeZone);
  return dt.hour * 60 + dt.minute + dt.second / 60;
}

function buildHourLabels(timeZone, use12h, baseDate) {
  const base = DateTime.fromJSDate(baseDate).setZone(timeZone).startOf("day");
  return Array.from({ length: 24 }, (_, h) => {
    const dt = base.plus({ hours: h });
    return use12h ? dt.toFormat("ha").toLowerCase() : dt.toFormat("HH:00");
  });
}

function formatDayHeader(now, timeZone) {
  return DateTime.fromJSDate(now).setZone(timeZone).toFormat("ccc, dd LLL yyyy");
}

function formatClock(now, timeZone, use12h) {
  const dt = DateTime.fromJSDate(now).setZone(timeZone);
  return use12h
    ? dt.toFormat("hh:mm a")
    : dt.toFormat("HH:mm");
}

function cityFromZone(tz) {
  const opt = TIMEZONE_OPTIONS.find((x) => x.id === tz);
  if (!opt) return tz;
  const label = opt.label;
  const cut = label.indexOf(" (");
  return cut >= 0 ? label.slice(0, cut) : label;
}

function gmtOffset(now, tz) {
  const dt = DateTime.fromJSDate(now).setZone(tz);

  const offset = dt.offset; // minutes
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);

  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const mins = abs % 60;

  return mins === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(mins).padStart(2, "0")}`;
}


const HOURS = 24;
const PX_PER_HOUR = 140;     // slightly wider so labels don't feel cramped
const ROW_H = 110;           // taller rows so info isn't squished
const LABEL_COL_W = 260;     // a bit wider for timezone names
const TIMELINE_W = HOURS * PX_PER_HOUR;



export default function Day() {
  const [zones, setZones] = useState(() => loadZones());
  const [selectedToAdd, setSelectedToAdd] = useState(() => {
    return TIMEZONE_OPTIONS.find((t) => t.id !== SINGAPORE_TZ)?.id ?? "UTC";
  });

  const [now, setNow] = useState(() => new Date());
  const [use12h, setUse12h] = useState(false);
  const baseDay = useMemo(() => new Date(), []);

  useEffect(() => saveZones(zones), [zones]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const mins = minutesFromMidnightInZone(new Date(), SINGAPORE_TZ);
    const x = (mins / 60) * PX_PER_HOUR;
    const target = Math.max(0, x - el.clientWidth / 2 + LABEL_COL_W);
    el.scrollLeft = target;
  }, []);

  const allZones = useMemo(() => [SINGAPORE_TZ, ...zones], [zones]);

  const optionsFiltered = useMemo(() => {
    const existing = new Set(allZones);
    return TIMEZONE_OPTIONS.filter((o) => !existing.has(o.id));
  }, [allZones]);

  function addTimezone() {
    const tz = selectedToAdd;
    if (!tz || tz === SINGAPORE_TZ) return;
    setZones((prev) => (prev.includes(tz) ? prev : [...prev, tz]));
  }

  function removeTimezone(tz) {
    setZones((prev) => prev.filter((x) => x !== tz));
  }

  return (
    <div className="flex gap-6">
      {/* SIDEBAR */}
      <aside className="w-72 shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Timezones</h2>
            <button
              onClick={() => setUse12h((v) => !v)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {use12h ? "12h" : "24h"}
            </button>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Singapore is pinned at the top. Add more timezones below.
          </p>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Add timezone</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
            >
              {optionsFiltered.length === 0 ? (
                <option value="">No more to add</option>
              ) : (
                optionsFiltered.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))
              )}
            </select>

            <button
              onClick={addTimezone}
              disabled={!selectedToAdd || optionsFiltered.length === 0}
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium text-slate-700">Selected</div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-sm">{safeZoneLabel(SINGAPORE_TZ)}</div>
                <span className="text-xs text-slate-500">Pinned</span>
              </div>

              {zones.length === 0 ? (
                <div className="text-sm text-slate-500">No additional timezones yet.</div>
              ) : (
                zones.map((tz) => (
                  <div
                    key={tz}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="text-sm">{safeZoneLabel(tz)}</div>
                    <button
                      onClick={() => removeTimezone(tz)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN (flex column so scroller can fill height) */}
      <section className="flex-1 min-w-0">
        <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-[calc(100vh-160px)]">
          {/* Header (not inside horizontal scroller) */}
          <div className="flex items-baseline justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h1 className="text-lg font-semibold">Day view</h1>
              <div className="text-sm text-slate-500">
                Horizontal scroll compares hours. Vertical scroll shows more timezones.
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Local now:{" "}
              {new Intl.DateTimeFormat("en-GB", { timeStyle: "medium" }).format(now)}
            </div>
          </div>

          {/* SCROLLER MUST BE flex-1 min-h-0 */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-auto isolate">

            {/* Rows */}
            <div className="divide-y divide-slate-200">
              {allZones.map((tz, idx) => {
                const isPinned = tz === SINGAPORE_TZ;
                const mins = minutesFromMidnightInZone(now, tz);
                const nowX = (mins / 60) * PX_PER_HOUR;
                const hourLabels = buildHourLabels(tz, use12h, baseDay);

                return (
                  <div
                    key={`${tz}-${idx}`}
                    className="flex"
                    style={{ minWidth: LABEL_COL_W + TIMELINE_W }}
                  >
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
                            <div className="truncate text-sm font-semibold">
                              {cityFromZone(tz)}
                            </div>
                            <div className="text-xs font-mono opacity-70">
                              {gmtOffset(now, tz)}
                            </div>
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
                      {/* Background grid (more visible) */}
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

                      {/* Now line */}
                      <div className="absolute top-0 bottom-0" style={{ left: nowX }}>
                        <div className="h-full w-[2px] bg-red-500" />
                        <div className="absolute top-2 left-2">
                          <div className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            now
                          </div>
                        </div>
                      </div>

                      {/* Placeholder */}
                      <div className="absolute left-0 right-0 bottom-3 px-4">
                        <div className="text-xs text-slate-500">(Meeting blocks go here later)</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
