import { FaArrowCircleLeft } from "react-icons/fa";
import { FaArrowCircleRight } from "react-icons/fa";

const ICON_SIZE = 30;


function padn(num, length) {
  return String(num).padStart(length, "0");
}

export default function Month() {
  const today = new Date();

  const year = today.getFullYear();
  const monthIndex = today.getMonth();

  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });

  const todayDay = today.getDate();

  // ---- Calendar Logic ----
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const startWeekday = firstDay.getDay(); // 0-6
  const daysInMonth = lastDay.getDate();

  const days = [];

  // empty slots before month starts
  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }

  // actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {currentMonth} {year}
        </h2>

        <div className="flex gap-2">
          <button><FaArrowCircleLeft size={ICON_SIZE} className="hover:text-blue-500"/></button>
          <button><FaArrowCircleRight size={ICON_SIZE} className="hover:text-blue-500"/></button>
        </div>
      </div>

      {/* WEEKDAY HEADER */}
      <div className="grid grid-cols-7 text-sm font-semibold text-center border-b pb-2">
        {weekdays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-200 mt-2">
        {days.map((day, idx) => (
          <div
            key={idx}
            className="bg-white p-2 flex flex-col"
          >
            {day && (
              <span
                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                ${
                  day === todayDay
                    ? "bg-slate-900 text-white"
                    : ""
                }`}
              >
                {padn(day, 2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
