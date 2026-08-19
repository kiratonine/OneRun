/**
 * Всё, что известно до рантайма и не вычисляется из состояния.
 * Скаляры — UPPER_SNAKE_CASE, конфиг-объекты — camelCase (они не скалярные значения).
 */

/** Базовый URL бэкенда. '/mock' переключает приложение на локальные фикстуры. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mock';
export const USE_MOCK_API = API_BASE_URL === '/mock';

/** Стиль без API-ключа. Проверено 19.08.2026: отдаёт 200 и 43 КБ JSON. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const MAP_INITIAL_CENTER: [number, number] = [52.5, 44.0]; // [lon, lat]
export const MAP_INITIAL_ZOOM = 6;
export const MAP_FIT_PADDING_PX = 60;
export const MAP_FIT_MAX_ZOOM = 8;
/** Шрифт подписей. Стиль Liberty отдаёт глифы только для Noto Sans — иначе 404. */
export const MAP_LABEL_FONT = ['Noto Sans Bold'];

/**
 * Палитра линий заявок. В рантайме цвет приходит с бэкенда в `Order.color`;
 * здесь она нужна моку, который повторяет поведение бэкенда один в один.
 */
export const ORDER_LINE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
] as const;

export const ORDER_LINE_WIDTH = 3;
export const ORDER_LINE_OPACITY = 0.85;
/** Ширина выбранной линии — клик по ней должен быть виден на карте, а не только в модалке. */
export const ORDER_LINE_SELECTED_WIDTH = 6;
/**
 * Ширина невидимого слоя-мишени. В трёхпиксельную линию на проекторе не попасть,
 * поэтому клик ловит прозрачный слой поверх той же геометрии.
 */
export const ORDER_LINE_HIT_WIDTH = 18;
/** Прозрачность линий заявок после построения рейса — они приглушаются, но не удаляются. */
export const ORDER_LINE_DIMMED_OPACITY = 0.25;
export const ROUTE_LINE_WIDTH = 6;
export const ROUTE_LINE_COLOR = '#0f172a';

export const DEMO_ORDER_INTERVAL_MS = 1500;
export const DEMO_ORDERS_COUNT = 6;

/** Запасной вариант, если Supabase Realtime не завёлся. */
export const POLL_INTERVAL_MS = 2000;

/** Искусственная задержка мока, чтобы состояния загрузки были видны в разработке. */
export const MOCK_LATENCY_MS = 200;

export const mapNavigationOptions = {
  showCompass: false,
  showZoom: true,
} as const;
