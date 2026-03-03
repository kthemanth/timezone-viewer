import { supabase } from "../utils/supabaseClient";

const MEETINGS_TTL_MS = 60_000;
const CAT_TTL_MS = 60_000;

const meetingsCache = new Map();
let catCache = { data: null, fetchedAt: 0, inFlight: null };

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

function mapMeetingRow(row) {
  return {
    id: row.id,
    title: row.title,
    startUtcISO: row.start_utc,
    endUtcISO: row.end_utc,
    location: row.location ?? "",
    notes: row.notes ?? "",
    color: row.color ?? "#2563eb",
  };
}

function isFresh(ts, ttl) {
  return Date.now() - ts < ttl;
}

function readMeetingsCache(userId) {
  const entry = meetingsCache.get(userId);
  if (!entry) return null;
  if (!isFresh(entry.fetchedAt, MEETINGS_TTL_MS)) return null;
  return entry.data;
}

function writeMeetingsCache(userId, data) {
  meetingsCache.set(userId, {
    data,
    fetchedAt: Date.now(),
    inFlight: null,
  });
}

export function invalidateMeetingsCache(userId) {
  meetingsCache.delete(userId);
}

export async function fetchMeetingsForUser(userId, { force = false } = {}) {
  assertSupabase();

  const cached = !force ? readMeetingsCache(userId) : null;
  if (cached) return cached;

  const existing = meetingsCache.get(userId);
  if (existing?.inFlight) {
    return existing.inFlight;
  }

  const inFlight = (async () => {
  const { data, error } = await supabase
    .from("meetings")
    .select("id,title,start_utc,end_utc,location,notes,color")
    .eq("user_id", userId)
    .order("start_utc", { ascending: true });

  if (error) throw error;
    const rows = (data ?? []).map(mapMeetingRow);
    writeMeetingsCache(userId, rows);
    return rows;
  })();

  meetingsCache.set(userId, {
    data: existing?.data ?? null,
    fetchedAt: existing?.fetchedAt ?? 0,
    inFlight,
  });

  return inFlight;
}

export async function upsertMeetingForUser(userId, meeting) {
  assertSupabase();

  const payload = {
    id: meeting.id,
    user_id: userId,
    title: meeting.title,
    start_utc: meeting.startUtcISO,
    end_utc: meeting.endUtcISO,
    location: meeting.location ?? "",
    notes: meeting.notes ?? "",
    color: meeting.color ?? "#2563eb",
  };

  const { data, error } = await supabase
    .from("meetings")
    .upsert(payload, { onConflict: "id" })
    .select("id,title,start_utc,end_utc,location,notes,color")
    .single();

  if (error) throw error;
  const saved = mapMeetingRow(data);

  const current = meetingsCache.get(userId)?.data ?? [];
  const next = current.some((m) => m.id === saved.id)
    ? current.map((m) => (m.id === saved.id ? saved : m))
    : [...current, saved];

  writeMeetingsCache(
    userId,
    next.slice().sort((a, b) => a.startUtcISO.localeCompare(b.startUtcISO))
  );

  return saved;
}

export async function deleteMeetingForUser(userId, meetingId) {
  assertSupabase();

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("user_id", userId);

  if (error) throw error;

  const current = meetingsCache.get(userId)?.data ?? [];
  writeMeetingsCache(
    userId,
    current.filter((m) => m.id !== meetingId)
  );
}

function mapCatRow(row) {
  return {
    dateISO: row.date,
    wetFoodTimes: Array.isArray(row.wet_food_times) ? row.wet_food_times : [],
    dryFoodTimes: Array.isArray(row.dry_food_times) ? row.dry_food_times : [],
    sleptHours: typeof row.slept_hours === "number" ? row.slept_hours : Number(row.slept_hours ?? 0),
    played: Boolean(row.played),
    pooped: Boolean(row.pooped),
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
  };
}

function readCatCache() {
  if (!catCache.data) return null;
  if (!isFresh(catCache.fetchedAt, CAT_TTL_MS)) return null;
  return catCache.data;
}

function writeCatCache(data) {
  catCache = {
    data,
    fetchedAt: Date.now(),
    inFlight: null,
  };
}

export function invalidateCatCache() {
  catCache = { data: null, fetchedAt: 0, inFlight: null };
}

export async function fetchCatActivity({ force = false } = {}) {
  assertSupabase();

  const cached = !force ? readCatCache() : null;
  if (cached) return cached;

  if (catCache.inFlight) {
    return catCache.inFlight;
  }

  const inFlight = (async () => {
  const { data, error } = await supabase
    .from("cat_activity")
    .select("date,wet_food_times,dry_food_times,slept_hours,played,pooped,notes,updated_at")
    .order("date", { ascending: true });

  if (error) throw error;
    const rows = (data ?? []).map(mapCatRow);
    writeCatCache(rows);
    return rows;
  })();

  catCache = { ...catCache, inFlight };
  return inFlight;
}

export async function upsertCatActivity(dateISO, row, userId) {
  assertSupabase();

  const payload = {
    date: dateISO,
    wet_food_times: row.wetFoodTimes,
    dry_food_times: row.dryFoodTimes,
    slept_hours: row.sleptHours,
    played: row.played,
    pooped: row.pooped,
    notes: row.notes ?? "",
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("cat_activity")
    .upsert(payload, { onConflict: "date" })
    .select("date,wet_food_times,dry_food_times,slept_hours,played,pooped,notes,updated_at")
    .single();

  if (error) throw error;
  const saved = mapCatRow(data);
  const current = catCache.data ?? [];
  const next = current.some((row) => row.dateISO === saved.dateISO)
    ? current.map((row) => (row.dateISO === saved.dateISO ? saved : row))
    : [...current, saved];
  writeCatCache(next.slice().sort((a, b) => a.dateISO.localeCompare(b.dateISO)));
  return saved;
}
