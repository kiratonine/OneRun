/**
 * Хуки TanStack Query. Ключи иерархичны, чтобы инвалидация из Supabase Realtime
 * била точечно: пришёл INSERT в orders → инвалидируем orders и pool, остальное живёт.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { CreateOrderPayload } from './types';

export const queryKeys = {
  settlements: ['settlements'] as const,
  orders: ['orders'] as const,
  pool: ['pool'] as const,
  trip: (id: string) => ['trip', id] as const,
};

/** Справочник неизменен в пределах сессии — не протухает и не перезапрашивается. */
export function useSettlements() {
  return useQuery({
    queryKey: queryKeys.settlements,
    queryFn: api.getSettlements,
    staleTime: Infinity,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: api.getOrders,
  });
}

export function usePool() {
  return useQuery({
    queryKey: queryKeys.pool,
    queryFn: api.getPool,
  });
}

export function useTrip(id: string | null) {
  return useQuery({
    queryKey: queryKeys.trip(id ?? ''),
    queryFn: () => api.getTrip(id as string),
    enabled: Boolean(id),
    staleTime: Infinity, // рейс кэширован в БД и не меняется — ТЗ FR-10
  });
}

/** Инвалидация после любой мутации, меняющей состав пула. */
function useInvalidatePool() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.pool });
  };
}

export function useCreateOrder() {
  const invalidatePool = useInvalidatePool();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => api.createOrder(payload),
    onSuccess: invalidatePool,
  });
}

export function useSeedDemoOrder() {
  const invalidatePool = useInvalidatePool();
  return useMutation({
    mutationFn: api.seedDemoOrder,
    onSuccess: invalidatePool,
  });
}

export function useResetDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resetDemo,
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTrip,
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trip(trip.id), trip);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pool });
    },
  });
}
