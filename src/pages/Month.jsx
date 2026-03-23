import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { fetchMeetingsForUser } from "../services/cloudStore";
import { Skeleton } from "../components/ui";

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
      isToday: sameDay(date, today),
      iso: toISODate(date),
      weekday: date.getDay(),
    };
  });
}

function meetingsBySingaporeDate(meetings) {
  const byDate = new Map();

  meetings.forEach((meeting) => {
    const sgDate = DateTime.fromISO(meeting.startUtcISO, { zone: "utc" })
      .setZone("Asia/Singapore")
      .toISODate();

    if (!sgDate) return;

    if (!byDate.has(sgDate)) {
      byDate.set(sgDate, []);
    }

    byDate.get(sgDate).push(meeting);
  });

  byDate.forEach((list) => {
    list.sort((a, b) => a.startUtcISO.localeCompare(b.startUtcISO));
  });

  return byDate;
}

export default function Month() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    monthIndex: today.getMonth(),
  }));

  const reloadMeetings = useCallback(
    async (force = false) => {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const loaded = await fetchMeetingsForUser(user.id, { force });
        setMeetings(loaded);
      } catch (err) {
        setError(err.message || "Failed to load meetings.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    reloadMeetings(true);
  }, [reloadMeetings]);

  const monthLabel = useMemo(() => {
    const d = new Date(view.year, view.monthIndex, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [view.year, view.monthIndex]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells = useMemo(
    () => buildMonthGrid(view.year, view.monthIndex, 0),
    [view.year, view.monthIndex]
  );

  const meetingsMap = useMemo(() => meetingsBySingaporeDate(meetings), [meetings]);

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

  function goToday() {
    const d = new Date();
    setView({ year: d.getFullYear(), monthIndex: d.getMonth() });
  }

  const prevMonthLabel = new Date(view.year, view.monthIndex - 1, 1).toLocaleString("default", { month: "short" });
  const nextMonthLabel = new Date(view.year, view.monthIndex + 1, 1).toLocaleString("default", { month: "short" });

  return (
    <div className="p-4 md:p-6 min-h-screen animate-[page-enter_0.3s_ease_both]" style={{ background: '#06061a' }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[28px] font-extrabold text-slate-100 tracking-tight leading-none">
            {monthLabel}
          </div>
          <div className="text-xs text-slate-600 font-medium mt-1">
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} this month
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            ◀ {prevMonthLabel}
          </button>
          <button
            onClick={goToday}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white border-0 transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.35)' }}
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 border border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            {nextMonthLabel} ▶
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl px-3 py-2 text-sm font-medium text-red-400 border border-red-500/30" style={{ background: 'rgba(239,68,68,0.08)' }}>
          {error}
        </div>
      ) : null}

      {/* Day labels — Sun first (weekStartsOn=0) */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-700 uppercase tracking-[0.07em] py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const isWeekend = cell.weekday === 0 || cell.weekday === 6;
          const dayMeetings = meetingsMap.get(cell.iso) ?? [];

          return (
            <div
              key={`${cell.iso}-${i}`}
              onClick={() => navigate(`/day/${cell.iso}`)}
              className="rounded-[10px] p-2 cursor-pointer transition-all duration-200 min-h-[80px]"
              style={{
                background: cell.isToday
                  ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))'
                  : isWeekend
                    ? 'rgba(0,0,0,0.12)'
                    : 'rgba(255,255,255,0.02)',
                border: cell.isToday
                  ? '1px solid rgba(99,102,241,0.4)'
                  : '1px solid rgba(255,255,255,0.05)',
                boxShadow: cell.isToday ? '0 0 16px rgba(99,102,241,0.15)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-${cell.isToday ? 'extrabold' : 'semibold'} ${
                    cell.inMonth
                      ? cell.isToday
                        ? 'text-indigo-300'
                        : 'text-slate-400'
                      : 'text-slate-700'
                  }`}
                >
                  {cell.day}
                </span>
                {cell.isToday && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.8)' }}
                  />
                )}
              </div>
              {cell.isToday && (
                <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider -mt-0.5 mb-1">Today</div>
              )}

              {/* Meeting chips */}
              <div className="flex flex-col gap-0.5">
                {dayMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-[5px] px-1.5 py-0.5 text-[9px] font-semibold truncate"
                    style={{
                      background: `${m.color}22`,
                      border: `1px solid ${m.color}55`,
                      color: m.color,
                    }}
                  >
                    {m.title}
                  </div>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-[9px] text-slate-600 font-medium px-1">+{dayMeetings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(6,6,26,0.7)' }}>
          <Skeleton width="200px" height="4px" />
        </div>
      )}
    </div>
  );
}
