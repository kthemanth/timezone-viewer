const DB_NAME = "quinn_calendar_db";
const DB_VERSION = 1;
const STORE_NAME = "records";

const MEETINGS_KEY = "meetings_v1";
const CAT_ACTIVITY_KEY = "cat_activity_v1";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getRecord(key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error ?? new Error("Failed to read record"));
  });
}

async function setRecord(key, payload) {
  const db = await openDatabase();
  const serialized = JSON.stringify(payload);
  const hash = await sha256Hex(serialized);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put({
      key,
      payload,
      hash,
      updatedAt: new Date().toISOString(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to persist record"));
  });
}

async function getVerifiedPayload(key, fallback) {
  try {
    const record = await getRecord(key);
    if (!record || typeof record !== "object") return fallback;

    const serialized = JSON.stringify(record.payload);
    const expected = await sha256Hex(serialized);

    if (record.hash !== expected) {
      return fallback;
    }

    return record.payload;
  } catch {
    return fallback;
  }
}

export async function loadMeetingsFromDB(fallback = []) {
  const data = await getVerifiedPayload(MEETINGS_KEY, fallback);
  return Array.isArray(data) ? data : fallback;
}

export async function saveMeetingsToDB(meetings) {
  await setRecord(MEETINGS_KEY, meetings);
}

export async function loadCatActivityFromDB(fallback = []) {
  const data = await getVerifiedPayload(CAT_ACTIVITY_KEY, fallback);
  return Array.isArray(data) ? data : fallback;
}

export async function saveCatActivityToDB(activityRows) {
  await setRecord(CAT_ACTIVITY_KEY, activityRows);
}
