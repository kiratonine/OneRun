import { useEffect } from 'react';

import { useTrip } from '@/api/queries';
import { ApiError } from '@/api/client';
import { useCurrentTripId } from './CurrentTripContext';

/**
 * Текущий рейс целиком. Данные берутся из кеша `useTrip`, а не из `createTrip.data`:
 * мутация живёт только на странице карты и умирает при переходе на другую вкладку.
 */
export function useCurrentTrip() {
  const { tripId, setTripId } = useCurrentTripId();
  const query = useTrip(tripId);

  // Рейс мог исчезнуть на бэкенде (демо сбросили). Держать мёртвый id смысла нет:
  // из-за него страница отчёта показывала бы ошибку вместо пустого состояния.
  const isMissing = query.error instanceof ApiError && query.error.status === 404;
  useEffect(() => {
    if (isMissing) setTripId(null);
  }, [isMissing, setTripId]);

  return {
    trip: isMissing ? undefined : query.data,
    tripId,
    setTripId,
    isPending: Boolean(tripId) && query.isPending,
  };
}
