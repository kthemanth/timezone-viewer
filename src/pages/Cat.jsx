import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa";
import { TIGROU_AUDIO, TIGROU_IMAGES } from "../data/tigrouMedia";
import { useAuth } from "../auth/useAuth";
import { fetchCatActivity, upsertCatActivity } from "../services/cloudStore";

const ICON_SIZE = 24;

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year, monthIndex, weekStartsOn = 0) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstOfMonth.getDay();
  const offset = (firstWeekday - weekStartsOn + 7) % 7;

  const gridStart = new Date(year, monthIndex, 1 - offset);
  const today = new Date();

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );

    return {
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday:
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate(),
      iso: toISODate(date),
    };
  });
}

function emptyRow(dateISO) {
  return {
    dateISO,
    wetFoodTimes: [],
    dryFoodTimes: [],
    sleptHours: 0,
    played: false,
    pooped: false,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeTimes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((value) => typeof value === "string" && /^\d{2}:\d{2}$/.test(value))
    .slice(0, 2)
    .sort();
}

function mealCount(row) {
  return (row?.wetFoodTimes?.length ?? 0) + (row?.dryFoodTimes?.length ?? 0);
}

function completedCount(row) {
  const wetDone = (row?.wetFoodTimes?.length ?? 0) > 0;
  const dryDone = (row?.dryFoodTimes?.length ?? 0) > 0;
  const sleptDone = (row?.sleptHours ?? 0) > 0;
  const playedDone = Boolean(row?.played);
  const poopedDone = Boolean(row?.pooped);
  return [wetDone, dryDone, sleptDone, playedDone, poopedDone].filter(Boolean).length;
}

function isFutureDay(iso, todayISO) {
  return iso > todayISO;
}

export default function Cat() {
  const { user } = useAuth();
  const todayISO = DateTime.now().setZone("Asia/Singapore").toISODate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);

  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const today = new Date();
  const [view, setView] = useState(() => ({ year: today.getFullYear(), monthIndex: today.getMonth() }));

  const reloadActivity = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const loaded = await fetchCatActivity({ force });
        setRows(loaded);
      } catch (err) {
        setError(err.message || "Failed to load cat activity.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    reloadActivity(false);
  }, [reloadActivity]);

  const rowsByDate = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => map.set(row.dateISO, row));
    return map;
  }, [rows]);

  const selectedRow = rowsByDate.get(selectedDateISO) ?? emptyRow(selectedDateISO);
  const selectedIsFuture = isFutureDay(selectedDateISO, todayISO);

  const monthLabel = useMemo(() => {
    const d = new Date(view.year, view.monthIndex, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [view.year, view.monthIndex]);

  const cells = useMemo(() => buildMonthGrid(view.year, view.monthIndex, 0), [view.year, view.monthIndex]);

  const currentImage = TIGROU_IMAGES.length > 0 ? TIGROU_IMAGES[imageIndex % TIGROU_IMAGES.length] : null;

  async function persistRow(dateISO, nextRow) {
    if (!user?.id) return;
    const saved = await upsertCatActivity(dateISO, nextRow, user.id);
    setRows((prev) => {
      const idx = prev.findIndex((row) => row.dateISO === dateISO);
      if (idx < 0) return [...prev, saved];
      const copy = prev.slice();
      copy[idx] = saved;
      return copy;
    });
  }

  async function upsertRow(dateISO, updateFn) {
    if (isFutureDay(dateISO, todayISO)) return;

    const existing = rowsByDate.get(dateISO) ?? emptyRow(dateISO);
    const next = {
      ...existing,
      ...updateFn(existing),
      updatedAt: new Date().toISOString(),
    };

    setRows((prev) => {
      const idx = prev.findIndex((row) => row.dateISO === dateISO);
      if (idx < 0) return [...prev, next];
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });

    try {
      await persistRow(dateISO, next);
    } catch (err) {
      setError(err.message || "Failed to save cat activity.");
    }
  }

  function setMealTimes(type, times) {
    upsertRow(selectedDateISO, () => ({ [type]: sanitizeTimes(times) }));
  }

  function addMealTime(type) {
    const current = selectedRow[type];
    if (current.length >= 2) return;
    const preset = current.length === 0 ? "08:00" : "20:00";
    setMealTimes(type, [...current, preset]);
  }

  function removeMealTime(type, index) {
    setMealTimes(
      type,
      selectedRow[type].filter((_, idx) => idx !== index)
    );
  }

  function updateMealTime(type, index, value) {
    const next = selectedRow[type].slice();
    next[index] = value;
    setMealTimes(type, next);
  }

  function setSleptHours(value) {
    upsertRow(selectedDateISO, () => ({ sleptHours: Math.max(0, Math.min(24, value)) }));
  }

  function toggleFlag(key) {
    upsertRow(selectedDateISO, (existing) => ({ [key]: !existing[key] }));
  }

  function updateNotes(nextNotes) {
    upsertRow(selectedDateISO, () => ({ notes: nextNotes }));
  }

  function prevMonth() {
    setView((v) => {
      const d = new Date(v.year, v.monthIndex - 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function nextMonth() {
    setView((v) => {
      const d = new Date(v.year, v.monthIndex + 1, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  }

  function playRandomCatAudio() {
    if (TIGROU_AUDIO.length === 0) return;
    const randomIndex = Math.floor(Math.random() * TIGROU_AUDIO.length);
    const audio = new Audio(TIGROU_AUDIO[randomIndex]);
    audio.play().catch(() => undefined);
  }

  function showPrevImage() {
    if (TIGROU_IMAGES.length <= 1) return;
    setImageFailed(false);
    setImageIndex((prev) => (prev - 1 + TIGROU_IMAGES.length) % TIGROU_IMAGES.length);
  }

  function showNextImage() {
    if (TIGROU_IMAGES.length <= 1) return;
    setImageFailed(false);
    setImageIndex((prev) => (prev + 1) % TIGROU_IMAGES.length);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Tigrou Tracker</h1>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-sm text-slate-500">
            Editing: {DateTime.fromISO(selectedDateISO).toFormat("cccc, dd LLL yyyy")}
          </div>
          <button
            type="button"
            onClick={() => reloadActivity(true)}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-3">
          <div className="relative">
            {currentImage && !imageFailed ? (
              <button type="button" onClick={playRandomCatAudio} className="w-full" title="MEOW!">
                <img
                  src={currentImage}
                  alt="Tigrou"
                  onError={() => setImageFailed(true)}
                  className="h-52 w-full rounded-xl object-cover"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={playRandomCatAudio}
                className="h-52 w-full rounded-xl border border-dashed border-amber-300 bg-white text-7xl"
                title="Play Tigrou sound"
              >
                🐈
              </button>
            )}

            <button
              type="button"
              onClick={showPrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm font-semibold shadow"
              aria-label="Previous Tigrou photo"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm font-semibold shadow"
              aria-label="Next Tigrou photo"
            >
              ›
            </button>
          </div>

          <div className="mt-2 text-center text-xs text-slate-600">
            {TIGROU_IMAGES.length > 0 ? `Photo ${imageIndex + 1}/${TIGROU_IMAGES.length}` : "Add images in public/media/tigrou/images"}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <MealTimeEditor
            label="Ate wet food"
            times={selectedRow.wetFoodTimes}
            onAdd={() => addMealTime("wetFoodTimes")}
            onUpdate={(idx, value) => updateMealTime("wetFoodTimes", idx, value)}
            onRemove={(idx) => removeMealTime("wetFoodTimes", idx)}
            disabled={selectedIsFuture}
          />

          <MealTimeEditor
            label="Ate dry food"
            times={selectedRow.dryFoodTimes}
            onAdd={() => addMealTime("dryFoodTimes")}
            onUpdate={(idx, value) => updateMealTime("dryFoodTimes", idx, value)}
            onRemove={(idx) => removeMealTime("dryFoodTimes", idx)}
            disabled={selectedIsFuture}
          />

          <div className="rounded-xl border border-slate-200 p-3">
            <label className="text-sm font-medium text-slate-700">Slept (hours)</label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={selectedRow.sleptHours}
              disabled={selectedIsFuture}
              onChange={(e) => setSleptHours(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {["played", "pooped"].map((key) => {
              const active = Boolean(selectedRow[key]);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={selectedIsFuture}
                  onClick={() => toggleFlag(key)}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm font-medium",
                    active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700",
                    selectedIsFuture ? "cursor-not-allowed opacity-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  {active ? "✓ " : "○ "}
                  {key === "played" ? "Played" : "Pooped"}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Daily notes</label>
            <textarea
              rows={3}
              disabled={selectedIsFuture}
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
              value={selectedRow.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Any special updates about Tigrou..."
            />
          </div>

          {selectedIsFuture ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Future dates are read-only. You can edit only past and current days.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          ) : null}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activities Summary</h2>
            <div className="text-sm text-slate-500">Hover over a day for full details!</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="hover:text-blue-500 transition-colors"
              aria-label="Previous month"
              title="Previous month"
            >
              <FaArrowCircleLeft size={ICON_SIZE} />
            </button>
            <div className="min-w-36 text-center text-base font-semibold">{monthLabel}</div>
            <button
              onClick={nextMonth}
              className="hover:text-blue-500 transition-colors"
              aria-label="Next month"
              title="Next month"
            >
              <FaArrowCircleRight size={ICON_SIZE} />
            </button>
          </div>
        </div>

        {loading ? <div className="mt-4 text-sm text-slate-500">Loading cat activity...</div> : null}

        <div className="mt-4 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 rounded-2xl border border-slate-200">
          {cells.map((cell) => {
            const row = rowsByDate.get(cell.iso) ?? emptyRow(cell.iso);
            const done = completedCount(row);
            const isOut = !cell.inMonth;
            const future = isFutureDay(cell.iso, todayISO);
            const selected = selectedDateISO === cell.iso;
            const meals = mealCount(row);

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => {
                  if (future) return;
                  setSelectedDateISO(cell.iso);
                }}
                className={[
                  "group relative min-h-[110px] border-b border-r border-slate-200 p-2 text-left",
                  isOut ? "bg-white text-slate-300" : "bg-slate-50 text-slate-800",
                  cell.isToday ? "ring-2 ring-amber-300 ring-inset" : "",
                  selected ? "ring-2 ring-blue-300 ring-inset" : "",
                  future ? "cursor-not-allowed opacity-60" : "hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{String(cell.day).padStart(2, "0")}</div>
                  {!isOut ? (
                    <div
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold text-white",
                        done === 5 ? "bg-emerald-600" : done >= 3 ? "bg-amber-500" : "bg-slate-700",
                      ].join(" ")}
                    >
                      {done}/5
                    </div>
                  ) : null}
                </div>

                {!isOut ? (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Meals</span>
                      <span className={meals >= 2 ? "text-emerald-700 font-semibold" : "text-slate-700"}>
                        {meals}/4
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <StatusDot active={row.played} label="Played" />
                      <StatusDot active={row.pooped} label="Pooped" />
                      <StatusDot active={row.sleptHours > 0} label="Slept" />
                    </div>
                  </div>
                ) : null}

                {!isOut ? (
                  <div className="pointer-events-none absolute left-1/2 top-2 z-20 hidden w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl group-hover:block">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-800">
                        {DateTime.fromISO(cell.iso).toFormat("dd LLL yyyy")}
                      </div>
                      <div className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {done}/5
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                      <MetricChip label="Wet Food" value={row.wetFoodTimes.length ? row.wetFoodTimes.join(", ") : "None"} />
                      <MetricChip label="Dry Food" value={row.dryFoodTimes.length ? row.dryFoodTimes.join(", ") : "None"} />
                      <MetricChip label="Sleep" value={`${row.sleptHours}h`} success={row.sleptHours > 0} />
                      <MetricChip label="Played" value={row.played ? "Yes" : "No"} success={row.played} />
                      <MetricChip label="Pooped" value={row.pooped ? "Yes" : "No"} success={row.pooped} />
                      <MetricChip label="Meals" value={`${meals}/4`} success={meals >= 2} />
                    </div>

                    {row.notes ? (
                      <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">
                        <span className="font-semibold text-slate-700">Notes:</span> {row.notes}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MealTimeEditor({ label, times, onAdd, onUpdate, onRemove, disabled }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          disabled={disabled || times.length >= 2}
          onClick={onAdd}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Time
        </button>
      </div>

      {times.length === 0 ? <div className="mt-2 text-xs text-slate-500">No timing added yet.</div> : null}

      <div className="mt-2 space-y-1">
        {times.map((value, idx) => (
          <div key={`${label}_${idx}`} className="flex items-center gap-2">
            <input
              type="time"
              value={value}
              disabled={disabled}
              onChange={(e) => onUpdate(idx, e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm disabled:bg-slate-100"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(idx)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Del
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ active, label }) {
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[8px] font-semibold",
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500",
      ].join(" ")}
      title={label}
    >
      {label[0]}
    </span>
  );
}

function MetricChip({ label, value, success = false }) {
  return (
    <div className={["rounded-lg border px-2 py-1", success ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"].join(" ")}>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 truncate text-[10px] font-medium text-slate-700">{value}</div>
    </div>
  );
}
