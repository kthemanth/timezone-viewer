import { DateTime } from "luxon";
import { SINGAPORE_TZ } from "../../data/timezones";

export default function MeetingsPanel({
  use12h,
  meetingForm,
  setMeetingForm,
  onSaveMeeting,
  meetingsForDay,
  onDeleteMeeting,
  onEditMeeting,
  onStartCreate,
  onCancelEdit,
  editingMeetingId,
  error,
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Meetings</div>
        <div className="text-xs text-slate-500">Saved</div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Title</label>
          {editingMeetingId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel edit
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartCreate}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Reset form
            </button>
          )}
        </div>

        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={meetingForm.title}
          onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Client sync"
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date (SG)</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={meetingForm.dateISO}
              onChange={(e) => setMeetingForm((p) => ({ ...p, dateISO: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <input
              type="color"
              className="h-[38px] w-full rounded-xl border border-slate-200 bg-white px-2 py-1"
              value={meetingForm.color}
              onChange={(e) => setMeetingForm((p) => ({ ...p, color: e.target.value }))}
              aria-label="Pick meeting color"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Start (SG)</label>
            <input
              type="time"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={meetingForm.startHHMM}
              onChange={(e) => setMeetingForm((p) => ({ ...p, startHHMM: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">End (SG)</label>
            <input
              type="time"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={meetingForm.endHHMM}
              onChange={(e) => setMeetingForm((p) => ({ ...p, endHHMM: e.target.value }))}
            />
          </div>
        </div>

        <label className="text-sm font-medium text-slate-700">Location</label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={meetingForm.location}
          onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))}
          placeholder="e.g. Zoom / Office / Client site"
        />

        <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={meetingForm.notes}
          onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Anything important..."
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          onClick={onSaveMeeting}
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          {editingMeetingId ? "Save meeting" : "Add meeting"}
        </button>

        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Meetings on selected day (SG)
          </div>

          {meetingsForDay.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">No meetings yet.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {meetingsForDay.map((m) => {
                const sSG = DateTime.fromISO(m.startUtcISO, { zone: "utc" }).setZone(SINGAPORE_TZ);
                const eSG = DateTime.fromISO(m.endUtcISO, { zone: "utc" }).setZone(SINGAPORE_TZ);

                const timeTxt = use12h
                  ? `${sSG.toFormat("h:mm a")}–${eSG.toFormat("h:mm a")}`
                  : `${sSG.toFormat("HH:mm")}–${eSG.toFormat("HH:mm")}`;

                const isEditingThis = editingMeetingId === m.id;

                return (
                  <div
                    key={m.id}
                    className={[
                      "flex items-start justify-between gap-2 rounded-xl border bg-white px-3 py-2",
                      isEditingThis ? "border-slate-400" : "border-slate-200",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                        <div className="truncate text-sm font-semibold text-slate-900">{m.title}</div>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">{timeTxt}</div>
                      {m.location ? (
                        <div className="mt-0.5 truncate text-xs text-slate-500">{m.location}</div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => onEditMeeting(m.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        title="Edit meeting"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteMeeting(m.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        title="Delete meeting"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Meetings use Singapore date/time input, are stored in UTC in IndexedDB, and rendered across all timezones.
      </div>
    </>
  );
}
