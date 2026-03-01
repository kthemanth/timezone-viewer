// Month grid starts on Monday and always returns 42 cells (6 weeks * 7 days)

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// JS getDay(): Sun=0, Mon=1 ... Sat=6
// We want Monday=0 ... Sunday=6
function weekdayMon0(d) {
  return d.getDay()
}

export function buildMonthGrid(anchorDate) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()

  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = weekdayMon0(firstOfMonth) // 0..6
  const gridStart = new Date(year, month, 1 - firstWeekday) // Monday before/at 1st

  const cells = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    )

    cells.push({
      date: startOfDay(date),
      inCurrentMonth: date.getMonth() === month,
    })
  }
  return cells
}
