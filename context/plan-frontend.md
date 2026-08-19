# План разработки — ФРОНТЕНД

**Проект:** «Сводный рейс» — консолидация грузов в отдалённые посёлки Мангистау
**Роль:** фронтенд-разработчик (1 человек)
**Бюджет времени:** ~10 часов кода + буфер
**Ветка:** `feat/frontend` (от `base`)

---

## 1. Зона ответственности

Ты владеешь **всей папкой `frontend/`** целиком. Никто, кроме тебя, сюда не коммитит.

Ты **не трогаешь** папку `backend/` ни при каких обстоятельствах. Если нужен эндпоинт, которого нет — пишешь в чат, не правишь чужой код.

Единственный общий артефакт — `README.md` в корне. Свою секцию добавляешь одним коммитом в конце, чтобы не конфликтовать.

---

## 2. Главное правило первого часа

**Не жди бэкенд.** Backend-1 отдаст рабочие ручки не раньше H+4, а карта и линии — это свои четыре часа работы. Поэтому:

1. С первой минуты пишешь против локального мока (`src/api/mock-data.ts`).
2. Базовый URL API живёт в одной константе. Переключение с мока на реальный бэкенд — это одна строка в `.env`.
3. Типы ответов копируешь из раздела 4 этого файла **буква в букву**. Они согласованы с бэкендом заранее.

```ts
// src/config/constants.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mock';
export const USE_MOCK_API = API_BASE_URL === '/mock';
```

---

## 3. Стек и структура

```
frontend/
└── src/
    ├── config/
    │   └── constants.ts          # все конфигурационные константы
    ├── api/
    │   ├── client.ts             # fetch-обёртка
    │   ├── mock-data.ts          # фикстуры на время разработки
    │   ├── types.ts              # типы ответов API (раздел 4)
    │   └── queries.ts            # хуки TanStack Query
    ├── map/
    │   ├── MapView.tsx           # контейнер MapLibre
    │   ├── useSettlementMarkers.ts
    │   ├── useOrderLines.ts
    │   └── useRouteLine.ts
    ├── realtime/
    │   └── useOrdersRealtime.ts  # подписка Supabase
    ├── features/
    │   ├── pool/PoolCounter.tsx
    │   ├── orders/OrdersTable.tsx
    │   ├── orders/OrderModal.tsx
    │   ├── trip/TripSummary.tsx
    │   └── report/ReportView.tsx
    ├── routes/
    │   ├── MapPage.tsx
    │   ├── OrdersPage.tsx
    │   ├── ReportPage.tsx
    │   └── DemoPage.tsx          # экран для телефона
    └── App.tsx
```

Стек: React 19 + Vite + TypeScript, TanStack Query v5, Tailwind, MapLibre GL JS, `react-router-dom`, `@supabase/supabase-js` (только для Realtime), `react-markdown`.

---

## 4. Контракт API — согласован, не меняем в одностороннем порядке

Все ручки под префиксом `${API_BASE_URL}/api`.

```ts
// src/api/types.ts

export interface Settlement {
  id: number;
  code: string;          // 'AKTAU'
  nameRu: string;        // 'Актау'
  nameKz: string | null;
  district: string | null;
  lat: number;
  lon: number;
}

export interface Order {
  id: string;
  code: string;                  // 'ORD-001'
  from: Settlement;
  to: Settlement;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
  color: string;                 // '#ef4444' — цвет линии, приходит с бэка
  status: 'new' | 'pooled' | 'routed';
  createdAt: string;
}

export interface PoolStatus {
  totalWeightKg: number;
  ordersCount: number;
  thresholdKg: number;
  isReady: boolean;
}

export interface TripOrderLine {
  orderCode: string;
  dropIndex: number;       // 1 = выгружается первым
  loadPosition: number;    // 1 = грузится последним, ставится у дверей
  priceKzt: number;
  legDistanceKm: number;
}

export interface Trip {
  id: string;
  code: string;                       // 'TRIP-001'
  stopOrder: string[];                // ['AKTAU','AKSHUKUR','SHETPE','AKTAU']
  routeGeometry: {
    type: 'LineString';
    coordinates: [number, number][];  // [lon, lat] — порядок как в GeoJSON
  };
  totalDistanceKm: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
  totalWeightKg: number;
  orders: TripOrderLine[];
  report: string;                     // Markdown
  reportSource: 'gemini' | 'mock';
}
```

| Метод | Путь | Тело запроса | Ответ |
|---|---|---|---|
| GET | `/api/health` | — | `{ status: 'ok' }` |
| GET | `/api/settlements` | — | `Settlement[]` |
| GET | `/api/orders` | — | `Order[]` |
| GET | `/api/pool` | — | `PoolStatus` |
| POST | `/api/orders` | `{ fromCode, toCode, shipperName, cargoName, weightKg, boxesCount?, boxNote? }` | `Order` |
| POST | `/api/demo/seed` | — | `Order` (одна следующая заявка) или `204` если набор исчерпан |
| POST | `/api/demo/reset` | — | `{ ok: true }` |
| POST | `/api/trips` | — | `Trip` |
| GET | `/api/trips/:id` | — | `Trip` |

**Важно про координаты.** `routeGeometry.coordinates` приходит в порядке `[lon, lat]` — это стандарт GeoJSON, и MapLibre ждёт именно его. А вот `Settlement.lat/lon` — отдельные поля, и при построении своих геометрий ты сам собираешь `[lon, lat]`. Перепутанный порядок даст линии, улетающие в Индийский океан — это самая частая ошибка в работе с картами.

---

## 5. Константы

Всё, что известно до рантайма и не вычисляется из состояния, живёт в `src/config/constants.ts` в `UPPER_SNAKE_CASE`:

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mock';

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const MAP_INITIAL_CENTER: [number, number] = [52.5, 44.0]; // [lon, lat]
export const MAP_INITIAL_ZOOM = 6;
export const MAP_FIT_PADDING_PX = 60;

export const ORDER_LINE_WIDTH = 3;
export const ORDER_LINE_OPACITY = 0.85;
export const ROUTE_LINE_WIDTH = 6;
export const ROUTE_LINE_COLOR = '#0f172a';

export const DEMO_ORDER_INTERVAL_MS = 1500;
export const DEMO_ORDERS_COUNT = 6;

export const POLL_INTERVAL_MS = 2000; // запасной вариант, если Realtime не завёлся
```

Объекты-конфиги, которые могут спредиться или расширяться, остаются в `camelCase` даже под `as const` — они не скалярные значения:

```ts
export const mapNavigationOptions = {
  showCompass: false,
  showZoom: true,
} as const;
```

---

## 6. Этапы

### H+0 — H+0:45 · Каркас и ранний деплой

- `npm create vite@latest frontend -- --template react-ts`
- Tailwind, `react-router-dom`, TanStack Query, MapLibre, `react-markdown`
- Четыре роута-заглушки: `/` (карта), `/orders`, `/report`, `/demo`
- **Задеплоить пустышку на Vercel прямо сейчас.** Не в конце. Деплой, отложенный на последний час, — классический способ потерять проект: сборка ломается на том, что локально работало, и разбираться приходится в цейтноте.

**Готово, когда:** публичная ссылка открывается и показывает четыре пустых экрана.

---

### H+0:45 — H+2:00 · Карта и посёлки

- `MapView.tsx` с инициализацией MapLibre, центр и зум из констант
- Маркеры населённых пунктов из `mock-data.ts` с подписями
- `fitBounds` по всем точкам при загрузке

Паттерн работы с MapLibre, если раньше не сталкивался: карта живёт **вне** React-дерева. Ты создаёшь инстанс один раз в `useEffect` с пустым массивом зависимостей, кладёшь в `useRef`, и дальше императивно управляешь источниками и слоями. Никакого ререндера карты при обновлении state не происходит и не должно.

```ts
const mapRef = useRef<maplibregl.Map | null>(null);
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!containerRef.current || mapRef.current) return;

  mapRef.current = new maplibregl.Map({
    container: containerRef.current,
    style: MAP_STYLE_URL,
    center: MAP_INITIAL_CENTER,
    zoom: MAP_INITIAL_ZOOM,
  });

  return () => {
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, []);
```

**Проверить в первые 15 минут:** отдаёт ли `MAP_STYLE_URL` стиль без ключа. Если нет — переключаешься на Leaflet с растровыми тайлами OSM, это займёт 20 минут и на демо разницу никто не заметит.

**Готово, когда:** карта Мангистау с 10+ подписанными посёлками.

---

### H+2:00 — H+3:00 · Слой данных

- `client.ts` — тонкая обёртка над `fetch`, читает `API_BASE_URL`
- `queries.ts` — хуки: `useSettlements`, `useOrders`, `usePool`, `useTrip`
- `mock-data.ts` — шесть заявок с реальными посёлками, суммарный вес 520 кг

Ключевая деталь TanStack Query для этого проекта: ключи запросов должны быть иерархичными, чтобы инвалидация из Realtime работала точечно.

```ts
export const queryKeys = {
  settlements: ['settlements'] as const,
  orders: ['orders'] as const,
  pool: ['pool'] as const,
  trip: (id: string) => ['trip', id] as const,
};
```

При приходе новой заявки из Realtime ты инвалидируешь `queryKeys.orders` и `queryKeys.pool` — и оба счётчика с линиями обновятся сами. Ручного пересчёта состояния писать не нужно, это и есть смысл библиотеки.

**Готово, когда:** заявки из мока лежат в кеше и видны в React Query Devtools.

---

### H+3:00 — H+4:30 · Линии заявок и модалка

- Каждая заявка — прямая линия `from → to` цветом из `order.color`
- Клик по линии открывает модалку с деталями

Правильный паттерн для набора линий в MapLibre — **один источник и один слой на все заявки**, а не источник на каждую. Заявки укладываются в одну `FeatureCollection`, цвет берётся из свойства фичи:

```ts
map.addSource('order-lines', { type: 'geojson', data: featureCollection });

map.addLayer({
  id: 'order-lines-layer',
  type: 'line',
  source: 'order-lines',
  paint: {
    'line-color': ['get', 'color'],   // цвет из properties фичи
    'line-width': ORDER_LINE_WIDTH,
    'line-opacity': ORDER_LINE_OPACITY,
  },
});
```

Дальше при каждой новой заявке ты не добавляешь слой, а вызываешь `getSource('order-lines').setData(newCollection)`. Это одна операция вместо шести слоёв, и клик обрабатывается одним обработчиком на слой:

```ts
map.on('click', 'order-lines-layer', (e) => {
  const orderCode = e.features?.[0]?.properties?.orderCode;
  if (orderCode) setSelectedOrderCode(orderCode);
});
map.on('mouseenter', 'order-lines-layer', () => {
  map.getCanvas().style.cursor = 'pointer';
});
```

Модалка: код заявки, отправитель, маршрут, груз, вес, места, габариты. После построения рейса в ней дополнительно показываются стоимость и очередь выгрузки — данные берутся из `Trip.orders` по `orderCode`.

**Готово, когда:** шесть разноцветных линий, клик по каждой открывает свою модалку.

---

### H+4:30 — H+5:15 · Счётчик пула и триггер

- Панель с суммарным весом: `520 / 500 кг · 6 заявок`
- Прогресс-бар до порога
- Кнопка «Построить рейс» появляется **только** при `pool.isReady === true`

Момент появления кнопки — кульминация демо. Сделай его заметным: смена цвета панели, лёгкая анимация появления кнопки. Судья должен увидеть переход, а не искать кнопку глазами.

**Готово, когда:** пять заявок — кнопки нет, шестая — кнопка появилась.

---

### H+5:15 — H+6:00 · Realtime

Подписка на вставки в `orders` через Supabase:

```ts
useEffect(() => {
  const channel = supabase
    .channel('orders-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        queryClient.invalidateQueries({ queryKey: queryKeys.pool });
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [queryClient]);
```

Обрати внимание: из события ты **не берёшь данные**. Ты используешь его только как сигнал «сходи перезапроси». Так проще, надёжнее и не нужно мапить сырую строку БД в свой тип.

**Запасной вариант, если Realtime не завёлся за 30 минут:** `refetchInterval: POLL_INTERVAL_MS` в `useOrders`. Визуально на демо неотличимо. Не героизируй — переключайся и иди дальше.

**Готово, когда:** заявка, созданная из второй вкладки, появляется в первой без перезагрузки.

---

### H+6:00 — H+7:00 · Построение рейса

- Кнопка вызывает `POST /api/trips`
- Пока ждём — состояние загрузки на кнопке
- Полученный `routeGeometry` рисуется отдельным слоем поверх линий заявок
- Точки объезда нумеруются по `stopOrder`
- Панель «было / стало / сэкономлено» с цифрами из `Trip`

Линии заявок при этом **не удаляй** — приглуши их прозрачностью до 0.25. Контраст «шесть тонких разноцветных прямых → одна жирная тёмная ломаная по дорогам» и есть визуальный аргумент проекта.

**Готово, когда:** нажатие рисует реальный маршрут и показывает три цифры экономии.

---

### H+7:00 — H+8:00 · Вкладки «Заявки» и «Отчёт»

- `OrdersPage` — таблица: цветной маркер, код, откуда, куда, груз, вес, места, статус. После рейса добавляются колонки «очередь выгрузки» и «стоимость».
- `ReportPage` — `Trip.report` через `react-markdown`, с типографикой Tailwind (`prose`-классы или руками)
- Кнопка «Показать отчёт» на карте ведёт на этот роут

**Готово, когда:** отчёт читается и выглядит как документ, а не как дамп текста.

---

### H+8:00 — H+8:45 · Демо-экран для телефона

Отдельный роут `/demo`, максимально простой — с него напарник будет управлять показом:

- Крупная кнопка «Создать заявки» — в цикле дёргает `POST /api/demo/seed` с интервалом `DEMO_ORDER_INTERVAL_MS`, `DEMO_ORDERS_COUNT` раз
- Крупная кнопка «Сброс» — `POST /api/demo/reset`
- Индикатор: сколько заявок отправлено

Никакой карты и таблиц здесь нет. Две кнопки на весь экран, крупный шрифт, работает на телефоне в один тап.

**Готово, когда:** с телефона по ссылке нажимается кнопка и на ноутбуке начинают появляться заявки.

---

### H+8:45 — H+10:00 · Стыковка, полировка, прогон

- Переключить `VITE_API_BASE_URL` на реальный бэкенд, пройти весь флоу
- Пофиксить расхождения типов (они будут)
- Проверить, что цифры на карте, в таблице и в отчёте совпадают
- Прогнать демо трижды подряд через кнопку «Сброс»

---

## 7. Чек-лист готовности

- [ ] Публичная ссылка открывается в инкогнито на чужом устройстве
- [ ] Карта показывает реальные посёлки Мангистау с подписями
- [ ] Шесть заявок — шесть различимых цветов
- [ ] Новая заявка появляется без перезагрузки
- [ ] Клик по линии открывает модалку с полными данными
- [ ] Кнопка «Построить рейс» появляется строго на шестой заявке
- [ ] Маршрут рисуется по дорогам, остановки пронумерованы
- [ ] Панель экономики показывает три числа
- [ ] Отчёт отрендерен и читаем
- [ ] `/demo` работает с телефона
- [ ] Демо прогоняется три раза подряд без правок в БД
- [ ] Нет ошибок в консоли на пути демо

---

## 8. Если отстаёшь — режу в этом порядке

1. Вкладка ручного создания заявки — целиком (она в «желательно»)
2. Нумерация остановок на карте — оставить только линию маршрута
3. Анимации и переходы
4. Колонки стоимости в таблице заявок — они есть в отчёте
5. Приглушение линий заявок после построения — просто оставить как есть

**Никогда не режу:** карту, линии заявок, счётчик с кнопкой по порогу, построение маршрута, экран экономики. Это и есть демо.
