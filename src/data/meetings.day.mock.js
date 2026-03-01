// Meetings for a specific day, stored in UTC ISO strings.
// Later you’ll fetch these from Google/Outlook and keep them in UTC.

export const mockMeetingsUTC = [
  {
    id: "u1",
    title: "Design Sync",
    startUtc: "2026-02-24T02:00:00Z", // 10:00 SGT
    endUtc: "2026-02-24T03:30:00Z",
  },
  {
    id: "u2",
    title: "Client Call",
    startUtc: "2026-02-24T07:30:00Z", // 15:30 SGT
    endUtc: "2026-02-24T08:15:00Z",
  },
  {
    id: "u3",
    title: "Late US Check-in",
    startUtc: "2026-02-24T16:00:00Z",
    endUtc: "2026-02-24T17:00:00Z",
  },
]
