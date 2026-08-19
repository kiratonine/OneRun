import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  REALTIME_CONNECT_TIMEOUT_MS,
  REALTIME_ORDERS_CHANNEL,
  REALTIME_ORDERS_TABLE,
  REALTIME_SCHEMA,
} from '@/config/constants';
import { queryKeys } from '@/api/queries';
import { supabase } from './supabase';
import { setRealtimeLive } from './realtime-status';

/**
 * Подписка на изменения таблицы заявок. Из события данные не берутся — оно работает
 * только сигналом «сходи перезапроси»: так не нужно мапить сырую строку БД в свой тип
 * и не бывает расхождения между тем, что нарисовано, и тем, что лежит на бэкенде.
 *
 * Слушаем не INSERT, а все события: «Сброс» на демо-экране удаляет заявки,
 * и без DELETE ноутбук узнал бы о сбросе только со следующим опросом — а опрос
 * при живом канале выключен.
 */
export function useOrdersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Локальная копия: в очистке TypeScript уже не помнит про проверку выше.
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel(REALTIME_ORDERS_CHANNEL)
      .on(
        'postgres_changes',
        { event: '*', schema: REALTIME_SCHEMA, table: REALTIME_ORDERS_TABLE },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
          void queryClient.invalidateQueries({ queryKey: queryKeys.pool });
        },
      )
      .subscribe((status) => {
        // Любой статус, кроме SUBSCRIBED (ошибка, таймаут, закрытие), возвращает опрос.
        setRealtimeLive(status === 'SUBSCRIBED');
      });

    /**
     * Сторожевой таймер вместо счётчика ошибок: при неверном URL сокет падает на DNS,
     * до join дело не доходит, и колбэк статуса не вызывается вообще — канал молча
     * висит в подключении, а supabase-js бесконечно переподключается.
     */
    const watchdog = setTimeout(() => {
      if (channel.state === 'joined') return;
      console.info('Realtime не поднялся — данные едут опросом');
      void client.removeChannel(channel);
      // Одного removeChannel мало: канал, который так и не присоединился, остаётся
      // в списке, сокет считает себя нужным и продолжает переподключаться.
      client.realtime.disconnect();
    }, REALTIME_CONNECT_TIMEOUT_MS);

    return () => {
      clearTimeout(watchdog);
      setRealtimeLive(false);
      void client.removeChannel(channel);
    };
  }, [queryClient]);
}
