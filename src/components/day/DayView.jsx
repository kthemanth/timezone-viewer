import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

import { SINGAPORE_TZ, TIMEZONE_OPTIONS } from "../../data/timezones";
import { loadJSON, saveJSON } from "../../utils/storage";
import { minutesFromMidnightInZone } from "../../utils/timezoneUtils";
import {
  meetingOverlapsDay,
  buildMeetingFromForm,
  getSingaporeDayWindowFromISO,
  meetingToForm,
  updateMeetingFromForm,
  moveMeetingByMinutes,
} from "../../utils/meetings";

import TimezoneSidebar from "./TimezoneSidebar";
import MeetingsPanel from "./MeetingsPanel";
import TimezoneRow from "./TimezoneRow";
import MeetingBands from "./MeetingBands";
import { useAuth } from "../../auth/useAuth";
import {
  deleteMeetingForUser,
  fetchMeetingsForUser,
  upsertMeetingForUser,
} from "../../services/cloudStore";

const STORAGE_KEY_ZONES = "quinn_calendar_selected_timezones_v1";

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

function defaultMeetingForm(dateISO) {
  const day = DateTime.fromISO(dateISO, { zone: SINGAPORE_TZ });
  const start = day.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
  const end = start.plus({ minutes: 60 });
  return {
    title: "New meeting",
    dateISO,
    startHHMM: start.toFormat("HH:mm"),
    endHHMM: end.toFormat("HH:mm"),
    location: "",
    notes: "",
    color: "#2563eb",
  };
}

function isEndAfterStart(form) {
  const [sh, sm] = (form.startHHMM || "").split(":").map((x) => parseInt(x, 10));
  const [eh, em] = (form.endHHMM || "").split(":").map((x) => parseInt(x, 10));
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return false;
  return eh * 60 + em > sh * 60 + sm;
}

export default function DayView({ selectedDateISO }) {
  const { user } = useAuth();
  const currentDayISO = selectedDateISO ?? DateTime.now().setZone(SINGAPORE_TZ).toISODate();

  const [zones, setZones] = useState(() => normalizeZones(loadJSON(STORAGE_KEY_ZONES, [])));
  const [meetingError, setMeetingError] = useState("");
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  const [selectedToAdd, setSelectedToAdd] = useState(() => {
    return TIMEZONE_OPTIONS.find((t) => t.id !== SINGAPORE_TZ)?.id ?? "UTC";
  });

  const [meetings, setMeetings] = useState([]);

  const [now, setNow] = useState(() => new Date());
  const [use12h, setUse12h] = useState(true);
  const [meetingForm, setMeetingForm] = useState(() => defaultMeetingForm(currentDayISO));

  const reloadMeetings = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      setLoadingMeetings(true);
      setMeetingError("");
      try {
        const rows = await fetchMeetingsForUser(user.id, { force });
        setMeetings(rows);
      } catch (err) {
        setMeetingError(err.message || "Failed to load meetings from Supabase.");
      } finally {
        setLoadingMeetings(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    saveJSON(STORAGE_KEY_ZONES, zones);
  }, [zones]);

  useEffect(() => {
    reloadMeetings(true);
  }, [reloadMeetings]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isToday = currentDayISO === DateTime.now().setZone(SINGAPORE_TZ).toISODate();
    const mins = isToday ? minutesFromMidnightInZone(new Date(), SINGAPORE_TZ) : 9 * 60;
    const x = (mins / 60) * PX_PER_HOUR;
    const target = Math.max(0, x - el.clientWidth / 2 + LABEL_COL_W);
    el.scrollLeft = target;
  }, [currentDayISO]);

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

  const dayWindow = useMemo(() => getSingaporeDayWindowFromISO(currentDayISO), [currentDayISO]);

  const meetingsForDay = useMemo(() => {
    const { dayStartUtc, dayEndUtc } = dayWindow;
    return meetings
      .filter((m) => meetingOverlapsDay(m, dayStartUtc, dayEndUtc))
      .sort((a, b) => a.startUtcISO.localeCompare(b.startUtcISO));
  }, [meetings, dayWindow]);

  function startCreateMeeting() {
    setEditingMeetingId(null);
    setMeetingError("");
    setMeetingForm(defaultMeetingForm(currentDayISO));
  }

  function startEditMeeting(id) {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;
    setEditingMeetingId(id);
    setMeetingError("");
    setMeetingForm(meetingToForm(target));
  }

  async function persistMeetingUpdate(nextMeeting) {
    if (!user?.id) return;
    const saved = await upsertMeetingForUser(user.id, nextMeeting);
    setMeetings((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
  }

  async function saveMeeting() {
    setMeetingError("");

    const title = (meetingForm.title || "").trim();
    if (!title) {
      setMeetingError("Please enter a meeting title.");
      return;
    }

    if (!isEndAfterStart(meetingForm)) {
      setMeetingError("End time must be later than start time.");
      return;
    }

    try {
      if (!editingMeetingId) {
        const newMeeting = buildMeetingFromForm(meetingForm);
        if (!newMeeting?.startUtcISO || !newMeeting?.endUtcISO) {
          setMeetingError("Invalid meeting time.");
          return;
        }

        setMeetings((prev) => [...prev, newMeeting]);
        await persistMeetingUpdate(newMeeting);

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
        return;
      }

      const existing = meetings.find((m) => m.id === editingMeetingId);
      if (!existing) return;

      const updated = updateMeetingFromForm(existing, meetingForm);
      if (!updated) {
        setMeetingError("Invalid meeting time.");
        return;
      }

      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      await persistMeetingUpdate(updated);

      setEditingMeetingId(null);
      setMeetingForm(defaultMeetingForm(currentDayISO));
    } catch (err) {
      setMeetingError(err.message || "Failed to save meeting.");
    }
  }

  async function deleteMeeting(id) {
    const before = meetings;
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMeetingForUser(user.id, id);
    } catch (err) {
      setMeetings(before);
      setMeetingError(err.message || "Failed to delete meeting.");
    }

    if (id === editingMeetingId) {
      setEditingMeetingId(null);
      setMeetingForm(defaultMeetingForm(currentDayISO));
    }
  }

  function cancelEditMeeting() {
    setEditingMeetingId(null);
    setMeetingError("");
    setMeetingForm(defaultMeetingForm(currentDayISO));
  }

  async function moveMeeting(id, deltaMinutes) {
    if (!deltaMinutes) return;

    const existing = meetings.find((m) => m.id === id);
    if (!existing) return;

    const moved = moveMeetingByMinutes(existing, deltaMinutes);
    setMeetings((prev) => prev.map((m) => (m.id === id ? moved : m)));

    try {
      await persistMeetingUpdate(moved);
    } catch (err) {
      setMeetings((prev) => prev.map((m) => (m.id === id ? existing : m)));
      setMeetingError(err.message || "Failed to move meeting.");
    }
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
              onSaveMeeting={saveMeeting}
              meetingsForDay={meetingsForDay}
              onDeleteMeeting={deleteMeeting}
              onEditMeeting={startEditMeeting}
              onStartCreate={startCreateMeeting}
              onCancelEdit={cancelEditMeeting}
              editingMeetingId={editingMeetingId}
              error={meetingError}
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
                {DateTime.fromISO(currentDayISO, { zone: SINGAPORE_TZ }).toFormat("cccc, dd LLL yyyy (SG)")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                {loadingMeetings ? "Loading meetings..." : `Local now: ${new Intl.DateTimeFormat("en-GB", { timeStyle: "medium" }).format(now)}`}
              </div>
              <button
                type="button"
                onClick={() => reloadMeetings(true)}
                disabled={loadingMeetings}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-auto isolate">
            <div className="relative" style={{ minWidth: LABEL_COL_W + TIMELINE_W }}>
              <MeetingBands
                meetingsForDay={meetingsForDay}
                dayWindow={dayWindow}
                rowCount={allZones.length}
                ROW_H={ROW_H}
                PX_PER_HOUR={PX_PER_HOUR}
                LABEL_COL_W={LABEL_COL_W}
                TIMELINE_W={TIMELINE_W}
                use12h={use12h}
                onEditMeeting={startEditMeeting}
                onMoveMeeting={moveMeeting}
              />

              <div className="divide-y divide-slate-200">
                {allZones.map((tz, idx) => (
                  <TimezoneRow
                    key={`${tz}-${idx}`}
                    tz={tz}
                    isPinned={tz === SINGAPORE_TZ}
                    now={now}
                    use12h={use12h}
                    dayWindow={dayWindow}
                    HOURS={HOURS}
                    PX_PER_HOUR={PX_PER_HOUR}
                    ROW_H={ROW_H}
                    LABEL_COL_W={LABEL_COL_W}
                    TIMELINE_W={TIMELINE_W}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
