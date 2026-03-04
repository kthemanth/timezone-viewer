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
const STORAGE_KEY_FAVORITES = "quinn_calendar_favorite_timezones_v1";

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

function normalizeFavorites(raw) {
  if (!Array.isArray(raw)) return [];
  return Array.from(new Set(raw.filter((x) => typeof x === "string" && x !== SINGAPORE_TZ)));
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
  const [favoriteZoneIds, setFavoriteZoneIds] = useState(() =>
    normalizeFavorites(loadJSON(STORAGE_KEY_FAVORITES, []))
  );
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
  const [selection, setSelection] = useState(null);
  const [selectionClickStart, setSelectionClickStart] = useState(null);
  const [selectionReady, setSelectionReady] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const dragSelectionRef = useRef({ active: false, moved: false, anchor: 0 });

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
    saveJSON(STORAGE_KEY_FAVORITES, favoriteZoneIds);
  }, [favoriteZoneIds]);

  useEffect(() => {
    if (zones.length > 0 || favoriteZoneIds.length === 0) return;
    setZones(favoriteZoneIds.filter((tz) => tz !== SINGAPORE_TZ));
  }, [favoriteZoneIds, zones.length]);

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

  function toggleFavorite(tz) {
    if (tz === SINGAPORE_TZ) return;
    setFavoriteZoneIds((prev) => (prev.includes(tz) ? prev.filter((x) => x !== tz) : [...prev, tz]));
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
      return false;
    }

    if (!isEndAfterStart(meetingForm)) {
      setMeetingError("End time must be later than start time.");
      return false;
    }

    try {
      if (!editingMeetingId) {
        const newMeeting = buildMeetingFromForm(meetingForm);
        if (!newMeeting?.startUtcISO || !newMeeting?.endUtcISO) {
          setMeetingError("Invalid meeting time.");
          return false;
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
        return true;
      }

      const existing = meetings.find((m) => m.id === editingMeetingId);
      if (!existing) return false;

      const updated = updateMeetingFromForm(existing, meetingForm);
      if (!updated) {
        setMeetingError("Invalid meeting time.");
        return false;
      }

      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      await persistMeetingUpdate(updated);

      setEditingMeetingId(null);
      setMeetingForm(defaultMeetingForm(currentDayISO));
      return true;
    } catch (err) {
      setMeetingError(err.message || "Failed to save meeting.");
      return false;
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

  const rowCount = allZones.length;
  const totalHeight = rowCount * ROW_H;

  function startTimeSelection(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const startX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const startMinutes = Math.round(((startX / rect.width) * 1440) / 15) * 15;

    dragSelectionRef.current = { active: true, moved: false, anchor: startMinutes };
    setSelection({ anchor: startMinutes, start: startMinutes, end: startMinutes + 60 });
    setSelectionReady(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveTimeSelection(event) {
    if (!dragSelectionRef.current.active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const minutes = Math.round(((x / rect.width) * 1440) / 15) * 15;

    if (Math.abs(minutes - dragSelectionRef.current.anchor) >= 15) {
      dragSelectionRef.current.moved = true;
    }

    setSelection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        start: Math.max(0, Math.min(prev.anchor, minutes)),
        end: Math.min(1440, Math.max(prev.anchor + 15, minutes)),
      };
    });
  }

  function endTimeSelection(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const minutes = Math.round(((x / rect.width) * 1440) / 15) * 15;

    const drag = dragSelectionRef.current;
    dragSelectionRef.current = { active: false, moved: false, anchor: 0 };

    if (drag.moved) {
      setSelection((prev) => {
        if (!prev) return prev;
        if (prev.end <= prev.start) {
          return { ...prev, end: Math.min(1440, prev.start + 60) };
        }
        return prev;
      });
      setSelectionClickStart(null);
      setSelectionReady(true);
      return;
    }

    if (selectionClickStart === null) {
      setSelectionClickStart(minutes);
      setSelection({ anchor: minutes, start: minutes, end: Math.min(1440, minutes + 60) });
      setSelectionReady(false);
      return;
    }

    const start = Math.max(0, Math.min(selectionClickStart, minutes));
    const end = Math.min(1440, Math.max(selectionClickStart + 15, minutes));
    setSelection({ anchor: selectionClickStart, start, end });
    setSelectionClickStart(null);
    setSelectionReady(true);
  }

  function confirmSelectionToMeeting() {
    if (!selection) return;
    const minsStart = Math.max(0, Math.min(selection.start, 1440));
    const minsEnd = Math.max(minsStart + 15, Math.min(selection.end, 1440));
    const start = dayWindow.dayStartUtc.plus({ minutes: minsStart }).setZone(SINGAPORE_TZ);
    const end = dayWindow.dayStartUtc.plus({ minutes: minsEnd }).setZone(SINGAPORE_TZ);

    setEditingMeetingId(null);
    setMeetingError("");
    setMeetingForm((prev) => ({
      ...prev,
      dateISO: currentDayISO,
      startHHMM: start.toFormat("HH:mm"),
      endHHMM: end.toFormat("HH:mm"),
    }));
    setShowQuickCreateModal(true);
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
            favoriteZoneIds={favoriteZoneIds}
            onToggleFavorite={toggleFavorite}
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
              <button
                type="button"
                onClick={() => {
                  setSelection(null);
                  setSelectionClickStart(null);
                  setSelectionReady(false);
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={confirmSelectionToMeeting}
                disabled={!selection || !selectionReady}
                className="rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Selection
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-auto isolate">
            <div className="relative" style={{ minWidth: LABEL_COL_W + TIMELINE_W }}>
              <TimeSelectionOverlay
                selection={selection}
                allZones={allZones}
                dayWindow={dayWindow}
                use12h={use12h}
                rowCount={rowCount}
                ROW_H={ROW_H}
                PX_PER_HOUR={PX_PER_HOUR}
                LABEL_COL_W={LABEL_COL_W}
                TIMELINE_W={TIMELINE_W}
                totalHeight={totalHeight}
                onStart={startTimeSelection}
                onMove={moveTimeSelection}
                onEnd={endTimeSelection}
                awaitingSecondClick={selectionClickStart !== null}
                selectionReady={selectionReady}
              />

              <MeetingBands
                meetingsForDay={meetingsForDay}
                dayWindow={dayWindow}
                rowCount={rowCount}
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

      <QuickCreateMeetingModal
        open={showQuickCreateModal}
        meetingForm={meetingForm}
        setMeetingForm={setMeetingForm}
        onClose={() => setShowQuickCreateModal(false)}
        onSave={async () => {
          const ok = await saveMeeting();
          if (ok) {
            setShowQuickCreateModal(false);
          }
        }}
        error={meetingError}
      />
    </div>
  );
}

function TimeSelectionOverlay({
  selection,
  allZones,
  dayWindow,
  use12h,
  rowCount,
  ROW_H,
  PX_PER_HOUR,
  LABEL_COL_W,
  TIMELINE_W,
  totalHeight,
  onStart,
  onMove,
  onEnd,
  awaitingSecondClick,
  selectionReady,
}) {
  const minsStart = selection ? Math.max(0, Math.min(selection.start, 1440)) : 0;
  const minsEnd = selection ? Math.max(0, Math.min(selection.end, 1440)) : 0;
  const leftPx = (minsStart / 60) * PX_PER_HOUR;
  const widthPx = ((Math.max(minsEnd - minsStart, 15)) / 60) * PX_PER_HOUR;

  function formatRange(tz) {
    if (!selection) return "";
    const start = dayWindow.dayStartUtc.plus({ minutes: minsStart }).setZone(tz);
    const end = dayWindow.dayStartUtc.plus({ minutes: minsEnd }).setZone(tz);
    return use12h
      ? `${start.toFormat("h:mm a")} - ${end.toFormat("h:mm a")}`
      : `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`;
  }

  return (
    <div
      className="absolute z-[45]"
      style={{
        left: LABEL_COL_W,
        top: 0,
        width: TIMELINE_W,
        height: totalHeight,
      }}
      onPointerDown={onStart}
      onPointerMove={onMove}
      onPointerUp={onEnd}
    >
      {selection ? (
        <>
          <div
            className="absolute top-0 bottom-0 border-2 border-fuchsia-500 bg-fuchsia-400/20 shadow-[0_0_30px_rgba(217,70,239,0.45)]"
            style={{ left: leftPx, width: widthPx }}
          />
          {Array.from({ length: rowCount }, (_, idx) => {
            const tz = allZones[idx];
            return (
              <div
                key={`sel-${tz}-${idx}`}
                className="absolute px-3 py-1 rounded-lg border border-fuchsia-300 bg-white/90 text-[12px] font-semibold text-fuchsia-800 shadow"
                style={{
                  left: leftPx + 6,
                  top: idx * ROW_H + ROW_H / 2 - 12,
                  maxWidth: Math.max(120, widthPx - 12),
                }}
              >
                {formatRange(tz)}
              </div>
            );
          })}
          <div className="absolute right-2 top-2 rounded-lg bg-fuchsia-700/90 px-3 py-1 text-[11px] font-semibold text-white">
            {selectionReady
              ? "Selection ready. Click Confirm Selection."
              : awaitingSecondClick
              ? "First click set. Click again to set end."
              : "Drag to compare or click twice to define range."}
          </div>
        </>
      ) : (
        <div className="absolute right-2 top-2 rounded-lg bg-slate-900/85 px-3 py-1 text-[11px] font-semibold text-white">
          Drag on timeline to compare time ranges across all timezones
        </div>
      )}
    </div>
  );
}

function QuickCreateMeetingModal({
  open,
  meetingForm,
  setMeetingForm,
  onClose,
  onSave,
  error,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Schedule Meeting</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Global sync"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Date (SG)</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.dateISO}
              onChange={(e) => setMeetingForm((p) => ({ ...p, dateISO: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Color</label>
            <input
              type="color"
              className="mt-1 h-[42px] w-full rounded-xl border border-slate-200 bg-white px-2 py-1"
              value={meetingForm.color}
              onChange={(e) => setMeetingForm((p) => ({ ...p, color: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Start (SG)</label>
            <input
              type="time"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.startHHMM}
              onChange={(e) => setMeetingForm((p) => ({ ...p, startHHMM: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">End (SG)</label>
            <input
              type="time"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.endHHMM}
              onChange={(e) => setMeetingForm((p) => ({ ...p, endHHMM: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Location</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.location}
              onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="Zoom / Office / Client site"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300"
              value={meetingForm.notes}
              onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500"
          >
            Save meeting
          </button>
        </div>
      </div>
    </div>
  );
}
