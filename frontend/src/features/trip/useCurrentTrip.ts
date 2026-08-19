import { useEffect } from 'react';

import { usePool, useTrip } from '@/api/queries';
import { ApiError } from '@/api/client';
import { useCurrentTripId } from './CurrentTripContext';

/**
 * Текущий рейс целиком. Данные берутся из кеша `useTrip`, а не из `createTrip.data`:
 * мутация живёт только на странице карты и умирает при переходе на другую вкладку.
 */
export function useCurrentTrip() {
  const { tripId, setTripId } = useCurrentTripId();
  const query = useTrip(tripId);
  const { data: pool } = usePool();

  // Рейс мог исчезнуть на бэкенде (демо сбросили). Держать мёртвый id смысла нет:
  // из-за него страница отчёта показывала бы ошибку вместо пустого состояния.
  const isMissing = query.error instanceof ApiError && query.error.status === 404;

  // «Сброс» нажимают с телефона, а рейс уже кэширован (`staleTime: Infinity`) —
  // сам по себе он не перезапросится и останется на карте. Пустой пул и есть
  // сигнал сброса: заявок нет, значит нечего и везти.
  const isPoolEmpty = pool?.ordersCount === 0;

  useEffect(() => {
    if (tripId && (isMissing || isPoolEmpty)) setTripId(null);
  }, [tripId, isMissing, isPoolEmpty, setTripId]);

  return {
    trip: isMissing || isPoolEmpty ? undefined : query.data,
    tripId,
    setTripId,
    isPending: Boolean(tripId) && query.isPending,
  };
}
