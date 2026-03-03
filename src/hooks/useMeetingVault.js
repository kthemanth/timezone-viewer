import { useCallback, useEffect, useState } from "react";
import { deriveMeetingKey } from "../utils/meetingCrypto";

function storageKey(userId) {
  return `meeting_vault_passphrase_${userId}`;
}

export function useMeetingVault(userId) {
  const [cryptoKey, setCryptoKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unlock = useCallback(
    async (passphrase) => {
      if (!userId || !passphrase) return false;
      setLoading(true);
      setError("");
      try {
        const key = await deriveMeetingKey(passphrase, userId);
        sessionStorage.setItem(storageKey(userId), passphrase);
        setCryptoKey(key);
        return true;
      } catch {
        setError("Failed to unlock meeting vault.");
        setCryptoKey(null);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const lock = useCallback(() => {
    if (userId) {
      sessionStorage.removeItem(storageKey(userId));
    }
    setCryptoKey(null);
    setError("");
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (!userId) {
        setCryptoKey(null);
        return;
      }

      const savedPassphrase = sessionStorage.getItem(storageKey(userId));
      if (!savedPassphrase) {
        setCryptoKey(null);
        return;
      }

      setLoading(true);
      try {
        const key = await deriveMeetingKey(savedPassphrase, userId);
        if (mounted) {
          setCryptoKey(key);
        }
      } catch {
        if (mounted) {
          setCryptoKey(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restore();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return {
    cryptoKey,
    locked: !cryptoKey,
    loading,
    error,
    unlock,
    lock,
  };
}
