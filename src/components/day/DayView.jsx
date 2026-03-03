import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

import { SINGAPORE_TZ, TIMEZONE_OPTIONS } from "../../data/timezones";
import { loadJSON, saveJSON } from "../../utils/storage";
import { minutesFromMidnightInZone } from "../../utils/timezoneUtils";
import { getSingaporeDayWindow, meetingOverlapsDay, buildMeetingFromForm } from "../../utils/meetings";

import TimezoneSidebar from "./TimezoneSidebar";
import MeetingsPanel from "./MeetingsPanel";
import TimezoneRow from "./TimezoneRow";

const STORAGE_KEY_ZONES = "quinn_calendar_selected_timezones_v1";
const STORAGE_KEY_MEETINGS = "quinn_calendar_meetings_v1";


const HOURS = 24;
const PX_PER_HOUR = 140;
const ROW_H = 110;
const LABEL_COL_W = 260;
const TIMELINE_W = HOURS * PX_PER_HOUR;

function normalizeZones(raw) {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw.filter((x) => typeof x === "string" && x !== SINGAPORE_TZ);
  return Array.from(new Set(cleaned));
}

function normalizeMeetings(raw) {
  if (!Array.isArray(raw)) return [];
  // minimal shape check
  return raw
    .filter(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.title === "string" &&
        typeof m.startUtcISO === "string" &&
        typeof m.endUtcISO === "string"
    )
    .map((m) => ({
      id: m.id,
      title: m.title,
      startUtcISO: m.startUtcISO,
      endUtcISO: m.endUtcISO,
      location: typeof m.location === "string" ? m.location : "",
      notes: typeof m.notes === "string" ? m.notes : "",
      color: typeof m.color === "string" ? m.color : "#2563eb",
    }));
}

function defaultMeetingForm() {
  const sg = DateTime.now().setZone(SINGAPORE_TZ);
  const start = sg.plus({ minutes: 30 - (sg.minute % 30) }).set({ second: 0, millisecond: 0 });
  const end = start.plus({ minutes: 60 });
  return {
    title: "New meeting",
    dateISO: sg.toISODate(),
    startHHMM: start.toFormat("HH:mm"),
    endHHMM: end.toFormat("HH:mm"),
    location: "",
    notes: "",
    color: "#2563eb",
  };
}

export default function DayView() {
  // zones
  const [zones, setZones] = useState(() =>
    normalizeZones(loadJSON(STORAGE_KEY_ZONES, []))
  );

  const [selectedToAdd, setSelectedToAdd] = useState(() => {
    return TIMEZONE_OPTIONS.find((t) => t.id !== SINGAPORE_TZ)?.id ?? "UTC";
  });

  // meetings
  const [meetings, setMeetings] = useState(() =>
    normalizeMeetings(loadJSON(STORAGE_KEY_MEETINGS, []))
  );

  // UI state
  const [now, setNow] = useState(() => new Date());
  const [use12h, setUse12h] = useState(false);
  const [meetingForm, setMeetingForm] = useState(() => defaultMeetingForm());

  // anchor “day” for this view
  const baseDay = useMemo(() => new Date(), []);

  // Persist
  useEffect(() => saveJSON(STORAGE_KEY_ZONES, zones), [zones]);
  useEffect(() => saveJSON(STORAGE_KEY_MEETINGS, meetings), [meetings]);

  // Tick clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll-to-now on mount
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

  const dayWindow = useMemo(() => getSingaporeDayWindow(baseDay), [baseDay]);
  const meetingsForDay = useMemo(() => {
    const { dayStartUtc, dayEndUtc } = dayWindow;
    return meetings.filter((m) => meetingOverlapsDay(m, dayStartUtc, dayEndUtc));
  }, [meetings, dayWindow]);

  function addMeeting() {
    const title = (meetingForm.title || "").trim();
    if (!title) return;

    const newMeeting = buildMeetingFromForm(meetingForm);
    if (!newMeeting?.startUtcISO || !newMeeting?.endUtcISO) return;

    setMeetings((prev) => [...prev, newMeeting]);

    // nudge time forward for convenience
    setMeetingForm((prev) => {
      const startSg = DateTime.fromISO(prev.dateISO, { zone: SINGAPORE_TZ }).set({
        hour: parseInt(prev.startHHMM.split(":")[0], 10),
        minute: parseInt(prev.startHHMM.split(":")[1], 10),
        second: 0,
        millisecond: 0,
      });
      const nextStart = startSg.plus({ minutes: 60 });
      const nextEnd = nextStart.plus({ minutes: 60 });
      return { ...prev, startHHMM: nextStart.toFormat("HH:mm"), endHHMM: nextEnd.toFormat("HH:mm") };
    });
  }

  function deleteMeeting(id) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="w-full flex gap-6">
      <aside className="w-72 shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <TimezoneSidebar
            zones={zones}
            use12h={use12h}
            onToggle12h={() => setUse12h((v) => !v)}
            selectedToAdd={selectedToAdd}
            setSelectedToAdd={setSelectedToAdd}
            optionsFiltered={optionsFiltered}
            onAddTimezone={addTimezone}
            onRemoveTimezone={removeTimezone}
          />

          <div className="mt-8 border-t border-slate-200 pt-6">
            <MeetingsPanel
              use12h={use12h}
              meetingForm={meetingForm}
              setMeetingForm={setMeetingForm}
              onAddMeeting={addMeeting}
              meetingsForDay={meetingsForDay}
              onDeleteMeeting={deleteMeeting}
            />
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-[calc(100vh-160px)]">
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

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-x-auto overflow-y-auto isolate"
          >
            <div className="divide-y divide-slate-200">
              {allZones.map((tz, idx) => (
                <TimezoneRow
                  key={`${tz}-${idx}`}
                  tz={tz}
                  isPinned={tz === SINGAPORE_TZ}
                  now={now}
                  use12h={use12h}
                  baseDay={baseDay}
                  meetingsForDay={meetingsForDay}
                  dayWindow={dayWindow}
                  HOURS={HOURS}
                  PX_PER_HOUR={PX_PER_HOUR}
                  ROW_H={ROW_H}
                  LABEL_COL_W={LABEL_COL_W}
                  TIMELINE_W={TIMELINE_W}
                />
              ))}
            </div>

            <div className="h-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
