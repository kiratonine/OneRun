/**
 * Всё, что известно до рантайма и не вычисляется из состояния.
 * Скаляры — UPPER_SNAKE_CASE, конфиг-объекты — camelCase (они не скалярные значения).
 */

/** Базовый URL бэкенда. '/mock' переключает приложение на локальные фикстуры. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mock';
export const USE_MOCK_API = API_BASE_URL === '/mock';

/**
 * Supabase нужен фронтенду только ради Realtime: в БД пишет NestJS, мы лишь слушаем
 * события как сигнал «сходи перезапроси». Без обеих переменных клиент не создаётся,
 * и живость данных обеспечивает опрос с POLL_INTERVAL_MS.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const IS_REALTIME_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const REALTIME_SCHEMA = 'public';
export const REALTIME_ORDERS_TABLE = 'orders';
export const REALTIME_ORDERS_CHANNEL = 'orders-feed';
/**
 * Сколько ждём подписки, прежде чем закрыть канал совсем. При неверном URL
 * supabase-js переподключается бесконечно и забивает консоль ошибками WebSocket,
 * а статус CHANNEL_ERROR при этом не приходит: сокет не доходит даже до join.
 * Опрос к этому моменту уже везёт данные, так что терять нечего.
 */
export const REALTIME_CONNECT_TIMEOUT_MS = 8000;

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
export const ROUTE_LINE_OPACITY = 0.95;
/** Белая обводка под маршрутом: тёмная ломаная иначе теряется на тёмных участках стиля. */
export const ROUTE_LINE_CASING_COLOR = '#ffffff';
export const ROUTE_LINE_CASING_WIDTH = ROUTE_LINE_WIDTH + 4;
/** Кружки с номерами остановок рисуются поверх всего — их читают с проектора. */
export const TRIP_STOP_CIRCLE_RADIUS = 11;
export const TRIP_STOP_LABEL_SIZE = 12;

/** Камера подъезжает к маршруту — на питче это читается как «вот он, ответ». */
export const MAP_ROUTE_FIT_DURATION_MS = 800;
/**
 * Отступы подгонки под маршрут. Слева больше остальных: там колонка оверлеев
 * (пул и экономика) шириной w-80, и без запаса Актау уезжает под панель.
 */
export const mapRouteFitPadding = { top: 60, right: 60, bottom: 60, left: 360 } as const;

/**
 * Ключ для id построенного рейса в localStorage. Списка рейсов в контракте нет,
 * поэтому после перезагрузки страницы восстановить рейс можно только по id.
 */
export const CURRENT_TRIP_STORAGE_KEY = 'onerun.currentTripId';

/**
 * Ключ темы. Свой, а не дефолтный `theme` из shadcn: под тем ключом на демо-ноутбуке
 * может лежать чужое значение, и приложение уехало бы в тёмную тему без спроса.
 */
export const THEME_STORAGE_KEY = 'onerun.theme';

export const DEMO_ORDER_INTERVAL_MS = 1500;
export const DEMO_ORDERS_COUNT = 6;
/** Сколько «Сброс» ждёт подтверждения, прежде чем снова стать обычной кнопкой. */
export const RESET_CONFIRM_TIMEOUT_MS = 4000;
/**
 * Резервный пульт на ноутбуке — на случай, если телефон или вайфай подведут.
 * Проверяем `code`, а не `key`: на русской раскладке `key` был бы «ч».
 * Ctrl+Shift+X не занят ни Chrome, ни Firefox, ни Edge.
 */
export const DEMO_FALLBACK_HOTKEY_CODE = 'KeyX';

/** Запасной вариант, если Supabase Realtime не завёлся. */
export const POLL_INTERVAL_MS = 2000;

/** Искусственная задержка мока, чтобы состояния загрузки были видны в разработке. */
export const MOCK_LATENCY_MS = 200;

export const mapNavigationOptions = {
  showCompass: false,
  showZoom: true,
} as const;
