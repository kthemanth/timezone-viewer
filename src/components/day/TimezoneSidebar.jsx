import { useState } from "react";
import { DateTime } from "luxon";
import { SINGAPORE_TZ } from "../../data/timezones";
import { cityFromZone, gmtOffset } from "../../utils/timezoneUtils";

function formatZoneDisplay(tz, now) {
  return `${cityFromZone(tz)} (${gmtOffset(now, tz)})`;
}

function formatOptionDisplay(option, now) {
  return `${option.label} (${gmtOffset(now, option.id)})`;
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

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Timezones</h2>
        <button
          onClick={onToggle12h}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {use12h ? "12h" : "24h"}
        </button>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Singapore is pinned. Search by city or GMT, and star favorites for quick access.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {favoriteZoneIds.length === 0 ? (
          <div className="text-xs text-slate-500">No favorites yet.</div>
        ) : (
          favoriteZoneIds.map((tz) => (
            <button
              key={`fav-${tz}`}
              type="button"
              onClick={() => setSelectedToAdd(tz)}
              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
              title="Set as selected timezone"
            >
              ★ {formatZoneDisplay(tz, now)}
            </button>
          ))
        )}
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium text-slate-700">Add timezone</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city or GMT..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />

        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={selectedToAdd}
          onChange={(e) => setSelectedToAdd(e.target.value)}
        >
          {sortedOptions.length === 0 ? (
            <option value="">No matches</option>
          ) : (
            sortedOptions.map((o, idx) => (
              <option key={`${o.id}_${o.label}_${idx}`} value={o.id}>
                {o.isFavorite ? `★ ${o.display}` : o.display}
              </option>
            ))
          )}
        </select>

        <button
          onClick={onAddTimezone}
          disabled={!selectedToAdd || sortedOptions.length === 0}
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium text-slate-700">Selected</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm">{formatZoneDisplay(SINGAPORE_TZ, now)}</div>
            <span className="text-xs text-slate-500">Pinned</span>
          </div>

          {zones.length === 0 ? (
            <div className="text-sm text-slate-500">No additional timezones yet.</div>
          ) : (
            zones.map((tz) => {
              const fav = favoriteZoneIds.includes(tz);
              return (
                <div
                  key={tz}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="text-sm">{formatZoneDisplay(tz, now)}</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(tz)}
                      className={[
                        "rounded-lg px-2 py-1 text-xs font-medium",
                        fav ? "text-amber-700 hover:bg-amber-50" : "text-slate-600 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {fav ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => onRemoveTimezone(tz)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
