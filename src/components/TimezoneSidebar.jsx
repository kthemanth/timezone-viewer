import { useMemo, useState } from "react"
import { tzMeta } from "../utils/luxonTime"

function isValidTimeZone(tz) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date())
    return true
  } catch {
    return false
  }
}

function AddTimezoneModal({ open, onClose, onAdd }) {
  const [label, setLabel] = useState("")
  const [tz, setTz] = useState("")
  const [error, setError] = useState("")

  const canSubmit = label.trim().length > 0 && tz.trim().length > 0

  const submit = () => {
    const tzTrim = tz.trim()
    if (!isValidTimeZone(tzTrim)) {
      setError("Invalid timezone. Example: Asia/Singapore or America/Los_Angeles")
      return
    }
    setError("")
    onAdd({
      id: crypto.randomUUID(),
      label: label.trim(),
      tz: tzTrim,
    })
    setLabel("")
    setTz("")
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-base font-semibold">Add timezone</div>
            <button
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Singapore / London / Client HQ..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Timezone (IANA)</label>
              <input
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Asia/Singapore"
              />
              <div className="mt-1 text-[11px] text-slate-500">
                Use IANA names (searchable online): <span className="font-medium">Europe/London</span>,{" "}
                <span className="font-medium">America/Los_Angeles</span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={[
                "h-10 px-4 rounded-xl text-sm font-medium",
                canSubmit
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed",
              ].join(" ")}
              onClick={submit}
              disabled={!canSubmit}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TimezoneSidebar({ timezones, onAdd, onRemove }) {
  const [open, setOpen] = useState(false)

  const meta = useMemo(() => {
    const m = {}
    for (const t of timezones) m[t.id] = tzMeta(t.tz)
    return m
  }, [timezones])

  return (
    <>
      <aside className="h-full p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Timezones</div>
          <button
            onClick={() => setOpen(true)}
            className="h-8 px-3 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            + Add
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-auto space-y-2 pr-1">
          {timezones.map((t) => (
            <div
              key={t.id}
              className="h-14 rounded-xl border border-slate-200 px-3 flex items-center justify-between bg-white"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.label}</div>
                <div className="text-xs text-slate-500 truncate">
                  {meta[t.id]?.abbr ?? ""} {meta[t.id]?.offset ?? ""} · {t.tz}
                </div>
              </div>
              <button
                onClick={() => onRemove(t.id)}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200"
                title="Remove"
                aria-label="Remove timezone"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
          Offsets update automatically with DST.
        </div>
      </aside>

      <AddTimezoneModal
        open={open}
        onClose={() => setOpen(false)}
        onAdd={onAdd}
      />
    </>
  )
}
