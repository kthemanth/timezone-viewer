import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { TIGROU_AUDIO, TIGROU_IMAGES } from "../data/tigrouMedia";
import { useAuth } from "../auth/useAuth";
import { fetchCatActivity, upsertCatActivity } from "../services/cloudStore";
import { GlassButton, GlassBadge, GlassToggle } from "../components/ui";

function emptyRow(dateISO) {
  return {
    dateISO,
    wetFoodTimes: [],
    dryFoodTimes: [],
    sleptHours: 0,
    played: false,
    pooped: false,
    treats: false,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}


function isFutureDay(iso, todayISO) {
  return iso > todayISO;
}

function cloneRow(row) {
  return {
    ...row,
    wetFoodTimes: [...(row.wetFoodTimes ?? [])],
    dryFoodTimes: [...(row.dryFoodTimes ?? [])],
  };
}

function rowsEqual(a, b) {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function Cat() {
  const { user } = useAuth();
  const todayISO = DateTime.now().setZone("Asia/Singapore").toISODate();
  const [rows, setRows] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_error, setError] = useState("");
  const [_status, setStatus] = useState("");
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);
  const [draftRow, setDraftRow] = useState(() => emptyRow(todayISO));

  const [photoIndex, setPhotoIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => DateTime.now().setZone('Asia/Singapore').startOf('month'));

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

  const persistedSelectedRow = rowsByDate.get(selectedDateISO) ?? emptyRow(selectedDateISO);
  const selectedRow = draftRow ?? persistedSelectedRow;
  const selectedIsFuture = isFutureDay(selectedDateISO, todayISO);
  const hasUnsavedChanges = !rowsEqual(selectedRow, persistedSelectedRow);

  useEffect(() => {
    setDraftRow(cloneRow(rowsByDate.get(selectedDateISO) ?? emptyRow(selectedDateISO)));
    setStatus("");
  }, [selectedDateISO, rowsByDate]);



async function saveSelectedDay() {
    if (selectedIsFuture || !user?.id || !draftRow) return;

    setSaving(true);
    setError("");
    setStatus("");
    try {
      const saved = await upsertCatActivity(selectedDateISO, draftRow, user.id);
      setRows((prev) => {
        const idx = prev.findIndex((row) => row.dateISO === selectedDateISO);
        if (idx < 0) return [...prev, saved];
        const copy = prev.slice();
        copy[idx] = saved;
        return copy;
      });
      setDraftRow(cloneRow(saved));
      setStatus("Saved.");
    } catch (err) {
      setError(err.message || "Failed to save cat activity.");
    } finally {
      setSaving(false);
    }
  }

const photos = TIGROU_IMAGES;
  const sounds = TIGROU_AUDIO;

  function playSound() {
    if (sounds.length === 0) return;
    const randomIndex = Math.floor(Math.random() * sounds.length);
    const audio = new Audio(sounds[randomIndex]);
    audio.play().catch(() => undefined);
  }

  return (
    <div className="min-h-screen p-4 md:p-6 font-sans" style={{ background: '#06061a' }}>
      {/* Fuchsia ambient orbs */}
      <div className="pointer-events-none fixed top-0 right-0 w-[400px] h-[300px]" style={{ background: 'radial-gradient(ellipse,rgba(217,70,239,0.10) 0%,transparent 65%)', borderRadius: '50%' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[350px] h-[280px]" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.08) 0%,transparent 65%)', borderRadius: '50%' }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 relative z-10">

        {/* LEFT: Photo carousel + quick stats */}
        <div className="flex flex-col gap-3">
          {/* Photo card */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(217,70,239,0.2)', background: 'rgba(13,13,43,0.7)', backdropFilter: 'blur(12px)' }}>
            <div className="relative h-72 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.2))' }}>
              {photos.length > 0
                ? <img src={photos[photoIndex]} alt="Tigrou" className="h-full w-full object-contain" />
                : <span style={{ fontSize: 64, filter: 'drop-shadow(0 0 20px rgba(217,70,239,0.4))' }}>🐱</span>
              }
              {/* Carousel controls */}
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-slate-400"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>◀</button>
                  <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-slate-400"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>▶</button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div key={i} onClick={() => setPhotoIndex(i)} className="cursor-pointer transition-all duration-200"
                        style={{ height: 4, width: i === photoIndex ? 18 : 6, borderRadius: 2, background: i === photoIndex ? 'linear-gradient(90deg,#d946ef,#a855f7)' : 'rgba(255,255,255,0.2)' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-100">Tigrou</div>
                <div className="text-[10px] text-purple-400 font-medium mt-0.5">
                  {selectedDateISO === DateTime.now().toISODate() ? 'Today 😸' : selectedDateISO}
                </div>
              </div>
              {sounds.length > 0 && (
                <button onClick={playSound} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-fuchsia-300 transition-all"
                  style={{ background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)' }}>
                  🔊 Purr
                </button>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '🍖', label: 'Fed', value: `${(draftRow?.wetFoodTimes?.length ?? 0) + (draftRow?.dryFoodTimes?.length ?? 0)}×`, color: 'rgba(217,70,239,', border: 'rgba(217,70,239,' },
              { emoji: '😴', label: 'Sleep', value: `${draftRow?.sleptHours ?? 0}h`, color: 'rgba(139,92,246,', border: 'rgba(139,92,246,' },
              { emoji: '🎮', label: 'Play', value: draftRow?.played ? '✓' : '—', color: 'rgba(99,102,241,', border: 'rgba(99,102,241,' },
            ].map(({ emoji, label, value, color, border }) => (
              <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: `${color}0.10)`, border: `1px solid ${border}0.22)` }}>
                <div style={{ fontSize: 20 }}>{emoji}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
                <div className="text-[11px] font-bold text-slate-100 mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Activity form */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,13,43,0.7)', border: '1px solid rgba(139,92,246,0.18)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-100">Daily Log</div>
            <GlassBadge variant="fuchsia">{selectedDateISO}</GlassBadge>
          </div>

          {/* Wet food times */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">🥩 Wet Food Times</div>
            <div className="flex flex-wrap gap-1.5">
              {(draftRow?.wetFoodTimes ?? []).map((t, i) => (
                <button key={i} onClick={() => setDraftRow(d => ({ ...d, wetFoodTimes: d.wetFoodTimes.filter((_,j)=>j!==i) }))}
                  className="font-mono text-[11px] font-semibold text-fuchsia-300 px-2.5 py-1 rounded-lg transition-all hover:opacity-75"
                  style={{ background: 'rgba(217,70,239,0.15)', border: '1px solid rgba(217,70,239,0.3)' }}>{t}</button>
              ))}
              <button
                onClick={() => { const t = prompt('Enter time (HH:MM)'); if (t) setDraftRow(d => ({ ...d, wetFoodTimes: [...(d.wetFoodTimes??[]), t] })) }}
                className="text-[11px] text-slate-600 px-2.5 py-1 rounded-lg transition-all hover:text-slate-400"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>+ Add</button>
            </div>
          </div>

          {/* Dry food times */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">🥜 Dry Food Times</div>
            <div className="flex flex-wrap gap-1.5">
              {(draftRow?.dryFoodTimes ?? []).map((t, i) => (
                <button key={i} onClick={() => setDraftRow(d => ({ ...d, dryFoodTimes: d.dryFoodTimes.filter((_,j)=>j!==i) }))}
                  className="font-mono text-[11px] font-semibold text-violet-300 px-2.5 py-1 rounded-lg transition-all hover:opacity-75"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>{t}</button>
              ))}
              <button
                onClick={() => { const t = prompt('Enter time (HH:MM)'); if (t) setDraftRow(d => ({ ...d, dryFoodTimes: [...(d.dryFoodTimes??[]), t] })) }}
                className="text-[11px] text-slate-600 px-2.5 py-1 rounded-lg transition-all hover:text-slate-400"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>+ Add</button>
            </div>
          </div>

          {/* Activity toggles 2×2 grid */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Activities</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: draftRow?.played ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${draftRow?.played ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                <span className="text-[11px] font-semibold text-indigo-300">🎮 Played</span>
                <GlassToggle checked={!!draftRow?.played} onChange={v => setDraftRow(d => ({ ...d, played: v }))} />
              </div>
              <div className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: draftRow?.treats ? 'rgba(217,70,239,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${draftRow?.treats ? 'rgba(217,70,239,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                <span className="text-[11px] font-semibold text-fuchsia-300">🍬 Treats</span>
                <GlassToggle checked={!!draftRow?.treats} onChange={v => setDraftRow(d => ({ ...d, treats: v }))} />
              </div>
              <div className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: draftRow?.pooped ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${draftRow?.pooped ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                <span className="text-[11px] font-semibold text-violet-300">💩 Bathroom</span>
                <GlassToggle checked={!!draftRow?.pooped} onChange={v => setDraftRow(d => ({ ...d, pooped: v }))} />
              </div>
              {/* Sleep stepper */}
              <div className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <span className="text-[11px] font-semibold text-violet-300">😴 Sleep</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDraftRow(d => ({ ...d, sleptHours: Math.max(0, (d.sleptHours??0) - 1) }))} className="text-slate-600 hover:text-slate-300 text-sm leading-none">−</button>
                  <span className="font-mono text-[12px] font-bold text-slate-100 min-w-[28px] text-center">{draftRow?.sleptHours ?? 0}h</span>
                  <button onClick={() => setDraftRow(d => ({ ...d, sleptHours: Math.min(24, (d.sleptHours??0) + 1) }))} className="text-slate-600 hover:text-slate-300 text-sm leading-none">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">📝 Notes</div>
            <textarea
              value={draftRow?.notes ?? ''}
              onChange={e => setDraftRow(d => ({ ...d, notes: e.target.value }))}
              placeholder="Anything notable today…"
              rows={2}
              className="w-full rounded-[10px] px-3 py-2 text-sm text-slate-300 resize-none focus:outline-none transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Outfit, sans-serif' }}
            />
          </div>

          {/* Save row */}
          <div className="flex items-center gap-2">
            <GlassButton variant="cat" onClick={saveSelectedDay} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save Log ✓'}
            </GlassButton>
            {hasUnsavedChanges && <GlassBadge variant="warn">● Unsaved</GlassBadge>}
          </div>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="relative z-10 rounded-2xl p-4" style={{ background: 'rgba(13,13,43,0.6)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)' }}>
        {/* Header with month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(m => m.minus({ months: 1 }))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >◀</button>
          <div className="text-xs font-bold text-slate-100">{calendarMonth.toFormat('MMMM yyyy')}</div>
          <button
            onClick={() => setCalendarMonth(m => m.plus({ months: 1 }))}
            disabled={calendarMonth >= DateTime.now().setZone('Asia/Singapore').startOf('month')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.04] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >▶</button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-slate-700 uppercase tracking-wider py-0.5">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {(() => {
          const firstDay = calendarMonth.startOf('month')
          const offset = firstDay.weekday - 1  // Mon=0, Sun=6
          const daysInMonth = calendarMonth.daysInMonth
          const cells = [
            ...Array(offset).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => calendarMonth.set({ day: i + 1 })),
          ]
          return (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const iso = day.toISODate()
                const row = rowsByDate.get(iso)
                const count = row ? [
                  (row.wetFoodTimes?.length > 0),
                  (row.dryFoodTimes?.length > 0),
                  (row.sleptHours > 0),
                  row.played, row.pooped, row.treats,
                ].filter(Boolean).length : 0
                const intensity = count / 6
                const isTodayCell = iso === todayISO
                const isSelected = iso === selectedDateISO
                const isFuture = iso > todayISO
                const bg = isTodayCell
                  ? 'linear-gradient(135deg,#a855f7,#d946ef)'
                  : isFuture
                    ? 'rgba(255,255,255,0.02)'
                    : count === 0
                      ? 'rgba(255,255,255,0.04)'
                      : `rgba(217,70,239,${intensity * 0.55 + 0.08})`

                const tooltipLines = row ? [
                  row.wetFoodTimes?.length ? `🥩 Wet: ${row.wetFoodTimes.join(', ')}` : null,
                  row.dryFoodTimes?.length ? `🥜 Dry: ${row.dryFoodTimes.join(', ')}` : null,
                  row.sleptHours ? `😴 Sleep: ${row.sleptHours}h` : null,
                  row.played ? '🎮 Played' : null,
                  row.pooped ? '💩 Bathroom' : null,
                  row.treats ? '🍬 Treats' : null,
                  row.notes ? `📝 ${row.notes}` : null,
                ].filter(Boolean) : []

                return (
                  <div key={iso} className="relative group" onClick={() => !isFuture && setSelectedDateISO(iso)}>
                    <div
                      className={`flex flex-col items-center justify-center rounded-lg py-1.5 transition-all duration-150 ${!isFuture ? 'cursor-pointer hover:brightness-125' : 'cursor-default opacity-30'} ${isSelected && !isTodayCell ? 'ring-2 ring-violet-500/60 ring-offset-1 ring-offset-[#06061a]' : ''}`}
                      style={{
                        background: bg,
                        boxShadow: isTodayCell ? '0 0 8px rgba(217,70,239,0.5)' : count > 4 ? '0 0 4px rgba(217,70,239,0.25)' : 'none',
                        minHeight: 36,
                      }}
                    >
                      <span className={`text-[11px] font-${isTodayCell ? 'extrabold' : 'medium'} ${isTodayCell ? 'text-white' : isSelected ? 'text-violet-300' : isFuture ? 'text-slate-800' : count > 0 ? 'text-fuchsia-200' : 'text-slate-600'}`}>
                        {day.day}
                      </span>
                      {!isFuture && count > 0 && (
                        <div className="flex gap-[2px] mt-0.5">
                          {[...Array(Math.min(count, 4))].map((_, j) => (
                            <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: isTodayCell ? 'rgba(255,255,255,0.7)' : 'rgba(217,70,239,0.7)' }} />
                          ))}
                          {count > 4 && <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(217,70,239,0.4)' }} />}
                        </div>
                      )}
                    </div>

                    {/* Hover tooltip */}
                    {!isFuture && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:block pointer-events-none" style={{ minWidth: 150 }}>
                        <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(13,13,43,0.97)', border: '1px solid rgba(139,92,246,0.4)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                          <div className="text-[10px] font-bold text-violet-300 mb-1.5">{DateTime.fromISO(iso).toFormat('EEE, MMM d')}</div>
                          {tooltipLines.length > 0
                            ? tooltipLines.map((line, j) => (
                              <div key={j} className="text-[10px] text-slate-300 leading-relaxed">{line}</div>
                            ))
                            : <div className="text-[10px] text-slate-600 italic">No activity logged</div>
                          }
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(139,92,246,0.4)' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-end">
          {[{label:'No data',bg:'rgba(255,255,255,0.04)'},{label:'Some',bg:'rgba(217,70,239,0.3)'},{label:'All done',bg:'rgba(217,70,239,0.7)'}].map(({label,bg}) => (
            <div key={label} className="flex items-center gap-1">
              <div style={{width:10,height:10,borderRadius:3,background:bg}} />
              <span className="text-[9px] text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
