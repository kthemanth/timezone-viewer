import { SINGAPORE_TZ } from "../../data/timezones";
import { safeZoneLabel } from "../../utils/timezoneUtils";

export default function TimezoneSidebar({
  zones,
  use12h,
  onToggle12h,
  selectedToAdd,
  setSelectedToAdd,
  optionsFiltered,
  onAddTimezone,
  onRemoveTimezone,
}) {
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
          onClick={onAddTimezone}
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
                  onClick={() => onRemoveTimezone(tz)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
