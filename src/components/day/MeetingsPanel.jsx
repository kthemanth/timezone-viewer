import { DateTime } from "luxon";
import { SINGAPORE_TZ } from "../../data/timezones";
import { GlassCard, GlassInput, GlassButton } from "../ui";

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
    <div
      className="h-full overflow-y-auto"
      style={{ background: "rgba(8,8,28,0.92)", padding: "14px" }}
    >
      {/* Section label */}
      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.08em] mb-2.5">
        {editingMeetingId ? "Edit Meeting" : "New Meeting"}
      </div>

      {/* Form */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          {editingMeetingId ? (
            <GlassButton
              type="button"
              variant="ghost"
              onClick={onCancelEdit}
              className="text-xs px-2 py-1"
            >
              Cancel edit
            </GlassButton>
          ) : (
            <GlassButton
              type="button"
              variant="ghost"
              onClick={onStartCreate}
              className="text-xs px-2 py-1"
            >
              Reset form
            </GlassButton>
          )}
        </div>

        <GlassInput
          label="Title"
          value={meetingForm.title}
          onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Client sync"
        />

        <div className="grid grid-cols-2 gap-2">
          <GlassInput
            label="Date (SG)"
            type="date"
            value={meetingForm.dateISO}
            onChange={(e) => setMeetingForm((p) => ({ ...p, dateISO: e.target.value }))}
          />

          <div className="flex flex-col gap-[5px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">
              Color
            </label>
            <input
              type="color"
              className="h-[38px] w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-2 py-1"
              value={meetingForm.color}
              onChange={(e) => setMeetingForm((p) => ({ ...p, color: e.target.value }))}
              aria-label="Pick meeting color"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <GlassInput
            label="Start (SG)"
            type="time"
            value={meetingForm.startHHMM}
            onChange={(e) => setMeetingForm((p) => ({ ...p, startHHMM: e.target.value }))}
          />

          <GlassInput
            label="End (SG)"
            type="time"
            value={meetingForm.endHHMM}
            onChange={(e) => setMeetingForm((p) => ({ ...p, endHHMM: e.target.value }))}
          />
        </div>

        <GlassInput
          label="Location"
          value={meetingForm.location}
          onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))}
          placeholder="e.g. Zoom / Office / Client site"
        />

        <div className="flex flex-col gap-[5px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            className="
              w-full resize-none rounded-[10px] px-3 py-[9px] text-sm text-slate-100
              bg-white/[0.04] border border-white/10
              placeholder:text-slate-600
              focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
              transition-all duration-200
            "
            value={meetingForm.notes}
            onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Anything important..."
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        <GlassButton
          variant="primary"
          onClick={onSaveMeeting}
          className="w-full"
        >
          {editingMeetingId ? "Save meeting" : "Add meeting"}
        </GlassButton>
      </div>

      {/* Meetings list section */}
      <div className="mt-5">
        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.08em] mb-2.5">
          Meetings on selected day (SG)
        </div>

        {meetingsForDay.length === 0 ? (
          <>
            <p
              className="text-[10px] text-slate-700 rounded-lg p-2.5 mt-2"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              Click &amp; drag on the timeline to select a time
            </p>
            {/* + New Meeting dashed card */}
            <div
              className="border border-dashed border-indigo-500/25 rounded-xl p-3 text-center text-[11px] font-semibold text-slate-600 hover:border-indigo-500/40 hover:text-slate-400 transition-all cursor-pointer mt-2"
              onClick={onStartCreate}
            >
              + New Meeting
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {meetingsForDay.map((m) => {
              const sSG = DateTime.fromISO(m.startUtcISO, { zone: "utc" }).setZone(SINGAPORE_TZ);
              const eSG = DateTime.fromISO(m.endUtcISO, { zone: "utc" }).setZone(SINGAPORE_TZ);

              const timeTxt = use12h
                ? `${sSG.toFormat("h:mm a")}–${eSG.toFormat("h:mm a")}`
                : `${sSG.toFormat("HH:mm")}–${eSG.toFormat("HH:mm")}`;

              const isEditingThis = editingMeetingId === m.id;
              const meetingColor = m.color || "#6366f1";

              return (
                <GlassCard
                  key={m.id}
                  level={2}
                  hover={true}
                  className={`p-3 mb-2 cursor-pointer${isEditingThis ? " border-indigo-400/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: meetingColor,
                            boxShadow: `0 0 6px ${meetingColor}`,
                          }}
                        />
                        <div className="truncate text-[13px] font-bold text-slate-200">
                          {m.title}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-indigo-400 mt-0.5">
                        {timeTxt}
                      </div>
                      {m.location ? (
                        <div className="text-[10px] text-slate-600 mt-0.5 truncate">
                          {m.location}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <GlassButton
                        variant="ghost"
                        onClick={() => onEditMeeting(m.id)}
                        className="text-xs px-2 py-1"
                        title="Edit meeting"
                      >
                        Edit
                      </GlassButton>
                      <GlassButton
                        variant="danger"
                        onClick={() => onDeleteMeeting(m.id)}
                        className="text-xs px-2 py-1"
                        title="Delete meeting"
                      >
                        Del
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {/* + New Meeting dashed card */}
            <div
              className="border border-dashed border-indigo-500/25 rounded-xl p-3 text-center text-[11px] font-semibold text-slate-600 hover:border-indigo-500/40 hover:text-slate-400 transition-all cursor-pointer"
              onClick={onStartCreate}
            >
              + New Meeting
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
