const ENC_PREFIX = "enc:v1:";
const AUTO_SEED = "quinn_meeting_auto_seed_v1";
const keyCache = new Map();

function toBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function simpleHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function placeholderTimesFromId(id) {
  const base = Date.UTC(2000, 0, 1, 0, 0, 0, 0);
  const minutes = simpleHash(id) % (24 * 60 - 1);
  const start = new Date(base + minutes * 60_000);
  const end = new Date(start.getTime() + 60_000);
  return {
    startUtcISO: start.toISOString(),
    endUtcISO: end.toISOString(),
  };
}

export async function deriveMeetingKey(passphrase, userId) {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`meeting-v1:${userId}`),
      iterations: 250000,
      hash: "SHA-256",
    },
    passphraseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function deriveAutoMeetingKey(userId) {
  if (!userId) {
    throw new Error("Missing user id for meeting crypto.");
  }

  if (keyCache.has(userId)) {
    return keyCache.get(userId);
  }

  const key = await deriveMeetingKey(`${AUTO_SEED}:${userId}`, userId);
  keyCache.set(userId, key);
  return key;
}

export async function encryptMeetingPayload(meeting, cryptoKey) {
  const payload = {
    title: meeting.title,
    startUtcISO: meeting.startUtcISO,
    endUtcISO: meeting.endUtcISO,
    location: meeting.location ?? "",
    notes: meeting.notes ?? "",
    color: meeting.color ?? "#2563eb",
  };

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext);

  return `${ENC_PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptMeetingPayload(encrypted, cryptoKey) {
  if (!encrypted?.startsWith(ENC_PREFIX)) {
    throw new Error("Meeting payload is not encrypted with current format.");
  }

  const raw = encrypted.slice(ENC_PREFIX.length);
  const [ivBase64, dataBase64] = raw.split(".");
  if (!ivBase64 || !dataBase64) {
    throw new Error("Invalid encrypted payload format.");
  }

  const iv = fromBase64(ivBase64);
  const data = fromBase64(dataBase64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, data);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function meetingToEncryptedRow(meeting, encryptedPayload) {
  const placeholder = placeholderTimesFromId(meeting.id);
  return {
    id: meeting.id,
    title: encryptedPayload,
    startUtcISO: placeholder.startUtcISO,
    endUtcISO: placeholder.endUtcISO,
    location: "",
    notes: "",
    color: "#0f172a",
  };
}

export function isEncryptedMeetingRow(row) {
  return typeof row?.title === "string" && row.title.startsWith(ENC_PREFIX);
}
