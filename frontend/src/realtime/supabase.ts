/**
 * Клиент Supabase — только ради Realtime. Фронтенд ничего не пишет в БД:
 * все мутации идут через NestJS, поэтому здесь достаточно anon-ключа.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { IS_REALTIME_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config/constants';

/**
 * null, если переменных окружения нет: на моке и в первых прогонах их не будет,
 * а падать из-за этого приложение не должно — вместо подписки включается опрос.
 */
export const supabase: SupabaseClient | null = IS_REALTIME_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      // Демо — шесть заявок за девять секунд, ограничитель по умолчанию (10/сек) избыточен.
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
