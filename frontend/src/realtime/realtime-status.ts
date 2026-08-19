/**
 * Живость Realtime-канала — внешнее хранилище, а не контекст.
 * Статус нужен запросам (`useOrders`, `usePool`) для выбора между подпиской и опросом,
 * а тянуть queries.ts в React-контекст подписки значило бы закольцевать импорты.
 */

import { useSyncExternalStore } from 'react';

let isLive = false;
const listeners = new Set<() => void>();

/** Вызывается из useOrdersRealtime при смене статуса канала. */
export function setRealtimeLive(next: boolean) {
  if (isLive === next) return;
  isLive = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** true — события приходят сами, опрос не нужен. */
export function useIsRealtimeLive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isLive,
    () => false,
  );
}
