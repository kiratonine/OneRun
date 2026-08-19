import { useCallback, useEffect, useRef, useState } from 'react';

import { DEMO_ORDERS_COUNT, DEMO_ORDER_INTERVAL_MS } from '@/config/constants';
import { useResetDemo, useSeedDemoOrder } from '@/api/queries';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Управление демо-набором с телефона. Заявки создаются по одной с паузой:
 * на экране ноутбука должно быть видно, как пул наполняется, а не как он
 * скачком становится готовым.
 *
 * Цикл асинхронный, поэтому у него есть номер прогона: «Сброс» и размонтирование
 * увеличивают счётчик, и старый цикл, проснувшись после паузы, молча выходит —
 * иначе сброс тут же затирался бы досылкой оставшихся заявок.
 */
export function useDemoSeeder() {
  const seedOrder = useSeedDemoOrder();
  const resetDemo = useResetDemo();

  const [sentCount, setSentCount] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runIdRef = useRef(0);
  useEffect(() => () => void runIdRef.current++, []);

  const seedAll = useCallback(async () => {
    if (isSeeding) return;

    const runId = ++runIdRef.current;
    setIsSeeding(true);
    setError(null);

    try {
      for (let i = 0; i < DEMO_ORDERS_COUNT; i += 1) {
        const order = await seedOrder.mutateAsync();
        if (runIdRef.current !== runId) return;

        // null = 204 от бэкенда: демо-набор кончился, слать дальше нечего.
        if (!order) {
          setIsExhausted(true);
          break;
        }
        setSentCount((count) => count + 1);

        if (i < DEMO_ORDERS_COUNT - 1) {
          await delay(DEMO_ORDER_INTERVAL_MS);
          if (runIdRef.current !== runId) return;
        }
      }
    } catch (cause) {
      if (runIdRef.current !== runId) return;
      setError(cause instanceof Error ? cause.message : 'Не удалось создать заявку');
    } finally {
      if (runIdRef.current === runId) setIsSeeding(false);
    }
  }, [isSeeding, seedOrder]);

  const reset = useCallback(async () => {
    runIdRef.current += 1; // отменяет незавершённый цикл досылки
    setIsSeeding(false);
    setError(null);

    try {
      await resetDemo.mutateAsync();
      setSentCount(0);
      setIsExhausted(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сбросить демо');
    }
  }, [resetDemo]);

  return {
    sentCount,
    totalCount: DEMO_ORDERS_COUNT,
    isSeeding,
    isResetting: resetDemo.isPending,
    isExhausted,
    error,
    seedAll,
    reset,
  };
}
