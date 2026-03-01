// We’ll use Intl.DateTimeFormat to get local hour/minute for a TZ.
// This avoids adding Luxon right now. Later we can switch for robustness.

function getParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
  const parts = dtf.formatToParts(date)
  const map = {}
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value
  }
  return map
}

export function minutesFromLocalMidnight(utcDate, timeZone) {
  const p = getParts(utcDate, timeZone)
  const hour = Number(p.hour)
  const minute = Number(p.minute)
  return hour * 60 + minute
}

// For display labels on the ruler per timezone row (optional later)
export function formatInTimeZone(utcDate, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utcDate)
}
