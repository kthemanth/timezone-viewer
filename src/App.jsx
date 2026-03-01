import { useMemo, useState } from "react"
import MonthView from "./components/MonthView"
import DayView from "./components/DayView"

function pad2(n) {
  return String(n).padStart(2, "0")
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export default function App() {
  const [view, setView] = useState("month") // "month" | "day"
  const [selectedISO, setSelectedISO] = useState(() => toISODate(new Date()))

  const goMonth = () => setView("month")
  const goDay = (iso) => {
    setSelectedISO(iso)
    setView("day")
  }

  return (
    <div className="h-screen w-screen bg-slate-50">
      <div className="h-full px-6 py-6">
        <div className="h-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {view === "month" ? (
            <MonthView selectedISO={selectedISO} onSelectDay={goDay} />
          ) : (
            <DayView selectedISO={selectedISO} onBackToMonth={goMonth} />
          )}
        </div>
      </div>
    </div>
  )
}
