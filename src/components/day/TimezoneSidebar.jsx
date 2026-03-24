import { useState } from "react";
import { DateTime } from "luxon";
import { SINGAPORE_TZ } from "../../data/timezones";
import { cityFromZone, gmtOffset } from "../../utils/timezoneUtils";
import { GlassInput } from "../ui";

function formatZoneDisplay(tz, now) {
  return `${cityFromZone(tz)} (${gmtOffset(now, tz)})`;
}

function formatOptionDisplay(option, now) {
  return `${option.label} (${gmtOffset(now, option.id)})`;
}

function isNightZone(tz) {
  const h = DateTime.now().setZone(tz).hour;
  return h < 6 || h >= 23;
}

function formatZoneTime(tz, use12h) {
  const dt = DateTime.now().setZone(tz);
  return dt.toFormat(use12h ? "h:mm a" : "HH:mm");
}

export default function TimezoneSidebar({
  zones,
  use12h,
  onToggle12h,
  selectedToAdd,
  setSelectedToAdd,
  optionsFiltered,
  onAddTimezone,
  onRemoveTimezone,
  favoriteZoneIds,
  onToggleFavorite,
}) {
  const now = new Date();
  const [query, setQuery] = useState("");

  const sortedOptions = (() => {
    const q = query.trim().toLowerCase();

    return optionsFiltered
      .slice()
      .map((o) => ({
        ...o,
        display: formatOptionDisplay(o, now),
        isFavorite: favoriteZoneIds.includes(o.id),
        offset: DateTime.fromJSDate(now).setZone(o.id).offset,
      }))
      .filter((o) => {
        if (!q) return true;
        return (
          o.display.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.label.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        if (a.offset !== b.offset) return a.offset - b.offset;
        return a.display.localeCompare(b.display);
      });
  })();

  const anchorNight = isNightZone(SINGAPORE_TZ);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        background: "rgba(8,8,24,0.9)",
        borderRight: "1px solid rgba(99,102,241,0.12)",
      }}
    >
      {/* Header: title + 12h/24h toggle */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-slate-200">Timezones</h2>
        <div className="flex gap-0 rounded-lg overflow-hidden">
          <button
            onClick={() => { if (!use12h) onToggle12h(); }}
            className={[
              "px-2 py-1 text-[11px] font-semibold transition-all",
              use12h
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-transparent text-slate-600 border border-transparent",
            ].join(" ")}
          >
            12h
          </button>
          <button
            onClick={() => { if (use12h) onToggle12h(); }}
            className={[
              "px-2 py-1 text-[11px] font-semibold transition-all",
              !use12h
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-transparent text-slate-600 border border-transparent",
            ].join(" ")}
          >
            24h
          </button>
        </div>
      </div>

      <p className="px-3 pb-2 text-[11px] text-slate-600">
        Singapore is pinned. Search by city or GMT, and star favorites for quick access.
      </p>

      {/* Anchor zone row */}
      <div
        className={[
          "px-3 py-2 flex items-center justify-between border-l-2 border-indigo-500 bg-indigo-500/[0.08]",
          anchorNight ? "bg-black/[0.15]" : "",
        ].join(" ")}
      >
        <div>
          <div className="text-[12px] font-bold text-slate-100">
            {formatZoneDisplay(SINGAPORE_TZ, now)}
          </div>
          <div className="font-mono text-[10px] text-indigo-400">
            {anchorNight ? "🌙 " : ""}{formatZoneTime(SINGAPORE_TZ, use12h)}
          </div>
        </div>
        <span className="text-[10px] text-indigo-500/60 font-semibold">Pinned</span>
      </div>

      {/* Other zone rows */}
      {zones.length === 0 ? (
        <div className="px-3 py-2 text-[11px] text-slate-600">No additional timezones yet.</div>
      ) : (
        zones.map((tz) => {
          const fav = favoriteZoneIds.includes(tz);
          const night = isNightZone(tz);
          return (
            <div
              key={tz}
              className={[
                "px-3 py-2 flex items-center justify-between border-l-2 border-transparent hover:bg-white/[0.03] transition-colors",
                night ? "bg-black/[0.15]" : "",
              ].join(" ")}
            >
              <div>
                <div className="text-[12px] font-semibold text-slate-300">
                  {formatZoneDisplay(tz, now)}
                </div>
                <div className="font-mono text-[10px] text-slate-600">
                  {night ? "🌙 " : ""}{formatZoneTime(tz, use12h)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(tz)}
                  className={[
                    "text-sm leading-none transition-colors",
                    fav ? "text-amber-400" : "text-slate-700 hover:text-amber-400",
                  ].join(" ")}
                  title={fav ? "Remove favorite" : "Add to favorites"}
                >
                  {fav ? "⭐" : "☆"}
                </button>
                <button
                  onClick={() => onRemoveTimezone(tz)}
                  className="text-[10px] font-semibold text-slate-700 hover:text-red-400 transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Favorites quick-access strip */}
      {favoriteZoneIds.length > 0 && (
        <div className="px-3 pt-3 flex flex-wrap gap-1.5">
          {favoriteZoneIds.map((tz) => (
            <button
              key={`fav-${tz}`}
              type="button"
              onClick={() => setSelectedToAdd(tz)}
              className="rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-amber-400/80 hover:text-amber-300 transition-colors"
              title="Set as selected timezone"
            >
              ★ {formatZoneDisplay(tz, now)}
            </button>
          ))}
        </div>
      )}

      {/* Add timezone section */}
      <div className="px-3 pt-4 pb-2 space-y-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">
          Add timezone
        </div>
        <GlassInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city or GMT..."
        />

        <select
          className="w-full rounded-[10px] px-3 py-[9px] text-sm border border-white/10 focus:outline-none focus:border-indigo-500/50 transition-all duration-200"
          style={{ background: '#0d0d2b', color: '#e2e8f0' }}
          value={selectedToAdd}
          onChange={(e) => setSelectedToAdd(e.target.value)}
        >
          {sortedOptions.length === 0 ? (
            <option value="" style={{ background: '#0d0d2b', color: '#e2e8f0' }}>No matches</option>
          ) : (
            sortedOptions.map((o, idx) => (
              <option style={{ background: '#0d0d2b', color: '#e2e8f0' }} key={`${o.id}_${o.label}_${idx}`} value={o.id}>
                {o.isFavorite ? `★ ${o.display}` : o.display}
              </option>
            ))
          )}
        </select>

        <button
          onClick={onAddTimezone}
          disabled={!selectedToAdd || sortedOptions.length === 0}
          className="w-full rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 transition-all"
        >
          Add
        </button>
      </div>

      {/* Add timezone dashed button */}
      <div
        onClick={onAddTimezone}
        className="border border-dashed border-indigo-500/25 rounded-lg text-[11px] text-indigo-600 font-semibold hover:border-indigo-500/40 hover:text-indigo-400 transition-all mx-3 mb-3 py-2 text-center cursor-pointer"
      >
        + Add another timezone
      </div>
    </div>
  );
}
