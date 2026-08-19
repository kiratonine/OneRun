import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { CURRENT_TRIP_STORAGE_KEY } from '@/config/constants';
import { CurrentTripProviderRaw } from './CurrentTripContext';

/** localStorage может быть недоступен (приватный режим Safari) — это не повод падать. */
function readStoredTripId(): string | null {
  try {
    return window.localStorage.getItem(CURRENT_TRIP_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredTripId(tripId: string | null) {
  try {
    if (tripId === null) window.localStorage.removeItem(CURRENT_TRIP_STORAGE_KEY);
    else window.localStorage.setItem(CURRENT_TRIP_STORAGE_KEY, tripId);
  } catch {
    // Рейс останется только в памяти вкладки — на демо этого достаточно.
  }
}

/**
 * Хранит id построенного рейса. В localStorage — чтобы F5 посреди демо
 * не стирал маршрут: в контракте API нет ручки «дай последний рейс».
 */
export function CurrentTripProvider({ children }: { children: ReactNode }) {
  const [tripId, setTripIdState] = useState<string | null>(readStoredTripId);

  const setTripId = useCallback((next: string | null) => {
    setTripIdState((current) => (current === next ? current : next));
    writeStoredTripId(next);
  }, []);

  const value = useMemo(() => ({ tripId, setTripId }), [tripId, setTripId]);

  return <CurrentTripProviderRaw value={value}>{children}</CurrentTripProviderRaw>;
}
