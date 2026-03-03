import { useParams } from "react-router-dom";
import { DateTime } from "luxon";
import DayView from "../components/day/DayView";

function normalizedIsoOrToday(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return DateTime.now().setZone("Asia/Singapore").toISODate();
  }

  const parsed = DateTime.fromISO(iso, { zone: "Asia/Singapore" });
  return parsed.isValid ? parsed.toISODate() : DateTime.now().setZone("Asia/Singapore").toISODate();
}

export default function Day() {
  const { iso } = useParams();
  const selectedDateISO = normalizedIsoOrToday(iso);

  return <DayView key={selectedDateISO} selectedDateISO={selectedDateISO} />;
}
