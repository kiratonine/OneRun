import { useEffect } from "react"

import { useOrders, useTrip } from "@/api/queries"
import { ApiError } from "@/api/client"
import { useCurrentTripId } from "./CurrentTripContext"

/**
 * Текущий рейс целиком. Данные берутся из кеша `useTrip`, а не из `createTrip.data`:
 * мутация живёт только на странице карты и умирает при переходе на другую вкладку.
 */
export function useCurrentTrip() {
  const { tripId, setTripId } = useCurrentTripId()
  const query = useTrip(tripId)
  const { data: orders } = useOrders()

  // Рейс мог исчезнуть на бэкенде (демо сбросили). Держать мёртвый id смысла нет:
  // из-за него страница отчёта показывала бы ошибку вместо пустого состояния.
  const isMissing =
    query.error instanceof ApiError && query.error.status === 404

  // «Сброс» нажимают с телефона, а рейс уже кэширован (`staleTime: Infinity`) —
  // сам по себе он не перезапросится и останется на карте. После сброса список
  // заявок пуст; после успешного рейса заявки остаются со статусом `routed`.
  const isOrdersEmpty = orders?.length === 0

  useEffect(() => {
    if (tripId && (isMissing || isOrdersEmpty)) setTripId(null)
  }, [tripId, isMissing, isOrdersEmpty, setTripId])

  return {
    trip: isMissing || isOrdersEmpty ? undefined : query.data,
    tripId,
    setTripId,
    isPending: Boolean(tripId) && query.isPending,
  }
}
